# data/processors/csv_processor.py
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CSVProcessor:
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.data: Dict[str, pd.DataFrame] = {}
        
    def load_all_data(self) -> Dict[str, pd.DataFrame]:
        """Load all CSV files into pandas DataFrames"""
        logger.info("📊 Loading CSV data...")
        
        csv_files = {
            'materials': 'material_master.csv',
            'stock_levels': 'stock_levels.csv',
            'material_orders': 'material_orders.csv',
            'sales_orders': 'sales_orders.csv',
            'suppliers': 'suppliers.csv',
            'stock_movements': 'stock_movements.csv',
            'dispatch_parameters': 'dispatch_parameters.csv'
        }
        
        for key, filename in csv_files.items():
            filepath = self.data_dir / filename
            if filepath.exists():
                try:
                    self.data[key] = pd.read_csv(filepath)
                    logger.info(f"  ✅ Loaded {key}: {len(self.data[key])} rows")
                    logger.info(f"     Columns: {list(self.data[key].columns)}")
                except Exception as e:
                    logger.error(f"  ❌ Error loading {filename}: {e}")
            else:
                logger.warning(f"  ⚠️  Missing {filename}")
        
        return self.data
    
    def get_material_info(self, part_id: str) -> Optional[Dict]:
        """Get detailed information about a material/part"""
        if 'materials' not in self.data:
            return None
            
        material = self.data['materials'][
            self.data['materials']['part_id'] == part_id
        ]
        
        if material.empty:
            return None
            
        return material.iloc[0].to_dict()
    
    def get_stock_level(self, part_id: str) -> Optional[Dict]:
        """Get current stock level for a part"""
        if 'stock_levels' not in self.data:
            return None
            
        stock = self.data['stock_levels'][
            self.data['stock_levels']['part_id'] == part_id
        ]
        
        if stock.empty:
            return {
                'part_id': part_id, 
                'quantity_available': 0,
                'location': 'Unknown'
            }
            
        return stock.iloc[0].to_dict()
    
    def get_pending_orders(self, part_id: Optional[str] = None) -> pd.DataFrame:
        """Get pending material orders"""
        if 'material_orders' not in self.data:
            return pd.DataFrame()
            
        orders = self.data['material_orders']
        # Status: 'Pending', 'In Transit', 'Delivered', 'Cancelled'
        pending = orders[orders['status'].isin(['Pending', 'In Transit'])]
        
        if part_id:
            pending = pending[pending['part_id'] == part_id]
            
        return pending
    
    def get_low_stock_materials(self, threshold: float = 1.0) -> List[Dict]:
        """
        Find materials where current stock is below minimum stock level
        threshold: multiplier for min_stock_level (1.0 = at min level, 0.5 = half of min level)
        """
        if 'stock_levels' not in self.data or 'dispatch_parameters' not in self.data:
            return []
            
        stock = self.data['stock_levels'].copy()
        dispatch = self.data['dispatch_parameters'].copy()
        
        # Merge stock with dispatch parameters
        merged = stock.merge(dispatch, on='part_id', how='inner')
        
        # Calculate stock ratio
        merged['stock_ratio'] = merged['quantity_available'] / merged['min_stock_level']
        
        # Find materials below threshold
        low_stock = merged[merged['stock_ratio'] < threshold].copy()
        
        # Add material descriptions
        if 'materials' in self.data:
            low_stock = low_stock.merge(
                self.data['materials'][['part_id', 'part_name', 'part_type']],
                on='part_id',
                how='left'
            )
        
        return low_stock.to_dict('records')
    
    def get_sales_orders_by_model(self, model: Optional[str] = None, version: Optional[str] = None) -> pd.DataFrame:
        """Get sales orders, optionally filtered by model and version"""
        if 'sales_orders' not in self.data:
            return pd.DataFrame()
            
        orders = self.data['sales_orders'].copy()
        
        if model:
            orders = orders[orders['model'] == model]
        
        if version:
            orders = orders[orders['version'] == version]
            
        return orders
    
    def get_supplier_info(self, supplier_id: str) -> Optional[Dict]:
        """Get supplier information"""
        if 'suppliers' not in self.data:
            return None
            
        supplier = self.data['suppliers'][
            self.data['suppliers']['supplier_id'] == supplier_id
        ]
        
        if supplier.empty:
            return None
            
        return supplier.iloc[0].to_dict()
    
    def get_suppliers_for_part(self, part_id: str) -> pd.DataFrame:
        """Get all suppliers for a specific part"""
        if 'suppliers' not in self.data:
            return pd.DataFrame()
        
        return self.data['suppliers'][
            self.data['suppliers']['part_id'] == part_id
        ].copy()
    
    def get_materials_by_type(self, part_type: str) -> pd.DataFrame:
        """Get all materials of a specific type"""
        if 'materials' not in self.data:
            return pd.DataFrame()
            
        return self.data['materials'][
            self.data['materials']['part_type'] == part_type
        ]
    
    def get_supplier_performance(self) -> List[Dict]:
        """Analyze supplier performance based on orders"""
        if 'material_orders' not in self.data or 'suppliers' not in self.data:
            return []
        
        orders = self.data['material_orders'].copy()
        
        # Convert dates
        orders['order_date'] = pd.to_datetime(orders['order_date'], errors='coerce')
        orders['expected_delivery_date'] = pd.to_datetime(orders['expected_delivery_date'], errors='coerce')
        orders['actual_delivered_at'] = pd.to_datetime(orders['actual_delivered_at'], errors='coerce')
        
        # Calculate delivery performance
        orders['on_time'] = (
            (orders['status'] == 'Delivered') & 
            (orders['actual_delivered_at'] <= orders['expected_delivery_date'])
        )
        
        # Group by supplier
        supplier_stats = orders.groupby('supplier_id').agg({
            'order_id': 'count',
            'on_time': 'sum',
            'quantity_ordered': 'sum'
        }).reset_index()
        
        supplier_stats.columns = ['supplier_id', 'total_orders', 'on_time_deliveries', 'total_quantity']
        supplier_stats['on_time_rate'] = (
            (supplier_stats['on_time_deliveries'] / supplier_stats['total_orders'] * 100)
            .fillna(0)
            .round(2)
        )
        
        # Get average supplier reliability from suppliers table
        if not self.data['suppliers'].empty:
            avg_reliability = self.data['suppliers'].groupby('supplier_id')['reliability_rating'].mean().reset_index()
            supplier_stats = supplier_stats.merge(avg_reliability, on='supplier_id', how='left')
        
        return supplier_stats.to_dict('records')
    
    def get_dispatch_parameters(self, part_id: str) -> Optional[Dict]:
        """Get dispatch parameters for a part"""
        if 'dispatch_parameters' not in self.data:
            return None
        
        params = self.data['dispatch_parameters'][
            self.data['dispatch_parameters']['part_id'] == part_id
        ]
        
        if params.empty:
            return None
        
        return params.iloc[0].to_dict()
    
    def calculate_total_demand(self, part_id: str) -> Dict:
        """Calculate total demand for a part from sales orders"""
        if 'sales_orders' not in self.data or 'materials' not in self.data:
            return {'total_demand': 0, 'orders': []}
        
        # Get material info to see which models use this part
        material = self.get_material_info(part_id)
        if not material or pd.isna(material.get('used_in_models')):
            return {'total_demand': 0, 'orders': []}
        
        used_in_models = str(material['used_in_models']).split(',')
        used_in_models = [m.strip() for m in used_in_models]
        
        # Get sales orders for those models
        sales = self.data['sales_orders']
        relevant_orders = sales[sales['model'].isin(used_in_models)]
        
        return {
            'total_orders': len(relevant_orders),
            'total_quantity': relevant_orders['quantity'].sum() if not relevant_orders.empty else 0,
            'orders': relevant_orders.to_dict('records')
        }