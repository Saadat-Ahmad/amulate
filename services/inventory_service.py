# services/inventory_service.py
from typing import Dict, List, Optional
import pandas as pd
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class InventoryService:
    def __init__(self, csv_processor):
        self.csv_processor = csv_processor
    
    def get_inventory_summary(self) -> Dict:
        """Get overall inventory summary statistics"""
        data = self.csv_processor.data
        
        if 'stock_levels' not in data:
            return {'error': 'Stock levels data not available'}
        
        stock = data['stock_levels']
        
        summary = {
            'total_materials': len(stock),
            'total_stock_value': 0,
            'low_stock_count': len(self.csv_processor.get_low_stock_materials()),
            'out_of_stock_count': len(stock[stock['quantity_available'] <= 0]),
            'categories': {}
        }
        
        # Calculate total stock value
        if 'materials' in data and 'suppliers' in data:
            # Get average price per part from suppliers
            suppliers = data['suppliers']
            avg_prices = suppliers.groupby('part_id')['price_per_unit'].mean().reset_index()
            avg_prices.columns = ['part_id', 'avg_price']
            
            merged = stock.merge(avg_prices, on='part_id', how='left')
            merged['stock_value'] = merged['quantity_available'] * merged['avg_price'].fillna(0)
            summary['total_stock_value'] = round(merged['stock_value'].sum(), 2)
            
            # Group by part type if available
            if 'materials' in data:
                merged = merged.merge(
                    data['materials'][['part_id', 'part_type']], 
                    on='part_id', 
                    how='left'
                )
                category_summary = merged.groupby('part_type').agg({
                    'part_id': 'count',
                    'stock_value': 'sum'
                }).reset_index()
                category_summary.columns = ['part_type', 'material_count', 'total_value']
                summary['categories'] = category_summary.to_dict('records')
        
        return summary
    
    def analyze_stock_health(self) -> List[Dict]:
        """Analyze stock health for all materials"""
        stock_levels = self.csv_processor.data.get('stock_levels')
        dispatch_params = self.csv_processor.data.get('dispatch_parameters')
        materials = self.csv_processor.data.get('materials')
        
        if stock_levels is None or dispatch_params is None:
            return []
        
        # Merge data
        merged = stock_levels.merge(dispatch_params, on='part_id', how='inner')
        
        if materials is not None:
            merged = merged.merge(
                materials[['part_id', 'part_name', 'part_type']], 
                on='part_id', 
                how='left'
            )
        
        # Calculate health metrics
        merged['stock_ratio'] = merged['quantity_available'] / merged['min_stock_level']
        merged['days_of_stock'] = self._estimate_days_of_stock(merged)
        
        # Classify health status
        def get_health_status(row):
            ratio = row['stock_ratio']
            if ratio <= 0:
                return 'OUT_OF_STOCK'
            elif ratio < 0.5:
                return 'CRITICAL'
            elif ratio < 1.0:
                return 'LOW'
            elif ratio < 1.5:
                return 'ADEQUATE'
            else:
                return 'HEALTHY'
        
        merged['health_status'] = merged.apply(get_health_status, axis=1)
        
        # Select relevant columns
        columns = ['part_id', 'part_name', 'part_type', 'quantity_available', 
                   'min_stock_level', 'stock_ratio', 'days_of_stock', 'health_status']
        
        # Only include columns that exist
        available_columns = [col for col in columns if col in merged.columns]
        
        result = merged[available_columns].to_dict('records')
        
        return result
    
    def _estimate_days_of_stock(self, df: pd.DataFrame) -> pd.Series:
        """Estimate days of stock remaining based on historical usage"""
        stock_movements = self.csv_processor.data.get('stock_movements')
        
        if stock_movements is None or stock_movements.empty:
            return pd.Series([30] * len(df))  # Default to 30 days
        
        # Filter for consumption movements
        movements = stock_movements.copy()
        
        # Check what types exist in the data
        if 'type' in movements.columns:
            # Look for consumption/outbound movements
            consumption_types = ['Consumption', 'consumption', 'OUT', 'out', 'Outbound', 'outbound']
            consumption = movements[movements['type'].isin(consumption_types)]
            
            if consumption.empty:
                return pd.Series([30] * len(df))
            
            # Convert date
            consumption['date'] = pd.to_datetime(consumption['date'], errors='coerce')
            consumption = consumption.dropna(subset=['date'])
            
            if consumption.empty:
                return pd.Series([30] * len(df))
            
            date_range = (consumption['date'].max() - consumption['date'].min()).days or 1
            
            # Calculate daily consumption per part
            daily_consumption = consumption.groupby('part_id')['quantity'].sum() / date_range
            
            # Estimate days for each part
            days_estimate = []
            for _, row in df.iterrows():
                part_id = row['part_id']
                available = row['quantity_available']
                
                if part_id in daily_consumption.index:
                    daily_use = abs(daily_consumption[part_id])  # Use absolute value
                    if daily_use > 0:
                        days = available / daily_use
                        days_estimate.append(min(days, 365))  # Cap at 1 year
                    else:
                        days_estimate.append(365)
                else:
                    days_estimate.append(30)  # Default
            
            return pd.Series(days_estimate)
        
        return pd.Series([30] * len(df))
    
    def get_reorder_recommendations(self) -> List[Dict]:
        """Get materials that should be reordered"""
        low_stock = self.csv_processor.get_low_stock_materials(threshold=1.0)
        
        recommendations = []
        
        for item in low_stock:
            part_id = item['part_id']
            
            # Get pending orders
            pending = self.csv_processor.get_pending_orders(part_id)
            pending_qty = pending['quantity_ordered'].sum() if not pending.empty else 0
            
            # Calculate recommended order quantity
            min_stock = item.get('min_stock_level', 0)
            reorder_qty = item.get('reorder_quantity', min_stock)
            available = item.get('quantity_available', 0)
            
            # Calculate shortage
            shortage = max(0, min_stock - available - pending_qty)
            
            # Determine order quantity
            if shortage > 0:
                order_qty = max(reorder_qty, shortage)
            else:
                order_qty = reorder_qty
            
            if order_qty > 0:
                recommendations.append({
                    'part_id': part_id,
                    'part_name': item.get('part_name', part_id),
                    'part_type': item.get('part_type', 'Unknown'),
                    'current_stock': available,
                    'pending_orders': pending_qty,
                    'min_stock_level': min_stock,
                    'recommended_order_qty': order_qty,
                    'priority': 'HIGH' if available < min_stock * 0.5 else 'MEDIUM'
                })
        
        return recommendations
    
    def forecast_stockout_risk(self, days_ahead: int = 30) -> List[Dict]:
        """Forecast materials at risk of stockout in the next X days"""
        health = self.analyze_stock_health()
        
        at_risk = []
        
        for item in health:
            days_of_stock = item.get('days_of_stock', 30)
            
            if days_of_stock < days_ahead:
                at_risk.append({
                    'part_id': item['part_id'],
                    'part_name': item.get('part_name', item['part_id']),
                    'days_until_stockout': round(days_of_stock, 1),
                    'current_stock': item['quantity_available'],
                    'health_status': item['health_status'],
                    'urgency': 'CRITICAL' if days_of_stock < 7 else 'HIGH' if days_of_stock < 14 else 'MEDIUM'
                })
        
        # Sort by urgency
        at_risk.sort(key=lambda x: x['days_until_stockout'])
        
        return at_risk
    
    def optimize_dispatch_parameters(self, part_id: str) -> Dict:
        """Suggest optimized dispatch parameters for a material"""
        movements = self.csv_processor.data.get('stock_movements')
        current_params = self.csv_processor.get_dispatch_parameters(part_id)
        
        if movements is None or current_params is None:
            return {'error': 'Insufficient data for optimization'}
        
        # Filter movements for this part
        part_movements = movements[movements['part_id'] == part_id].copy()
        
        if part_movements.empty:
            return {'error': 'No movement history for this part'}
        
        # Calculate consumption patterns
        consumption_types = ['Consumption', 'consumption', 'OUT', 'out', 'Outbound', 'outbound']
        consumption = part_movements[part_movements['type'].isin(consumption_types)]
        
        if consumption.empty:
            return current_params
        
        consumption['date'] = pd.to_datetime(consumption['date'], errors='coerce')
        consumption = consumption.dropna(subset=['date'])
        
        if consumption.empty:
            return current_params
        
        date_range = (consumption['date'].max() - consumption['date'].min()).days or 1
        
        # Calculate average daily consumption
        total_consumption = abs(consumption['quantity'].sum())
        avg_daily_consumption = total_consumption / date_range
        
        # Get supplier lead time
        suppliers = self.csv_processor.get_suppliers_for_part(part_id)
        lead_time_days = 14  # Default
        
        if not suppliers.empty:
            lead_time_days = suppliers['lead_time_days'].mean()
        
        # Calculate optimal parameters
        safety_factor = 1.5  # 50% buffer
        optimal_safety_stock = avg_daily_consumption * lead_time_days * safety_factor
        optimal_min_stock = (avg_daily_consumption * lead_time_days) + optimal_safety_stock
        
        # Reorder quantity - optimize for ordering frequency (e.g., every 2 weeks)
        order_frequency_days = current_params.get('reorder_interval_days', 14)
        optimal_reorder_qty = avg_daily_consumption * order_frequency_days
        
        # Round to reasonable values
        optimal_safety_stock = round(optimal_safety_stock)
        optimal_min_stock = round(optimal_min_stock)
        optimal_reorder_qty = round(optimal_reorder_qty)
        
        return {
            'part_id': part_id,
            'current_parameters': current_params,
            'recommended_parameters': {
                'min_stock_level': optimal_min_stock,
                'reorder_quantity': optimal_reorder_qty,
                'reorder_interval_days': order_frequency_days,
            },
            'analysis': {
                'avg_daily_consumption': round(avg_daily_consumption, 2),
                'estimated_lead_time_days': round(lead_time_days, 1),
                'data_period_days': date_range
            }
        }