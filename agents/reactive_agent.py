# agents/reactive_agent.py
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd
import logging
import mailtrap as mt


logger = logging.getLogger(__name__)

class ReactiveAgent:
    """Agent for monitoring and generating alerts"""
    
    def __init__(self, csv_processor, email_processor, bom_service, inventory_service):
        self.csv_processor = csv_processor
        self.email_processor = email_processor
        self.bom_service = bom_service
        self.inventory_service = inventory_service
    
    def generate_alerts(self) -> List[Dict[str, Any]]:
        """Generate all alerts based on current state"""
        alerts = []
        
        # 1. Stock level alerts
        alerts.extend(self._check_stock_alerts())
        
        # 2. Email-based alerts
        alerts.extend(self._check_email_alerts())
        
        # 3. Order alerts
        alerts.extend(self._check_order_alerts())
        
        # 4. Capacity alerts
        alerts.extend(self._check_capacity_alerts())
        
        # Sort by severity
        severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        alerts.sort(key=lambda x: severity_order.get(x['severity'], 4))
        
        return alerts
    
    def _check_stock_alerts(self) -> List[Dict]:
        """Check for stock-related alerts"""
        alerts = []
        
        # Critical low stock
        low_stock = self.csv_processor.get_low_stock_materials(threshold=0.5)
        for item in low_stock:
            alerts.append({
                'alert_type': 'LOW_STOCK',
                'severity': 'critical' if item.get('quantity_available', 0) == 0 else 'high',
                'message': f"Critical: {item.get('part_name', item['part_id'])} is at {item.get('quantity_available', 0)} units (below 50% of minimum stock level)",
                'material_id': item['part_id'],
                'action_required': f"Reorder immediately. Recommended quantity: {item.get('reorder_quantity', 'N/A')}",
                'created_at': datetime.now().isoformat()
            })
            mail = mt.MailFromTemplate(
                sender=mt.Address(email="hello@demomailtrap.co", name="Mailtrap Test"),
                to=[mt.Address(email="ahamadsaadat9@gmail.com")],
                template_uuid="4d98a5a6-e818-41f5-a9f3-01bdf94183fc",
                template_variables={
                "company_info_name": f"{item.get('part_name', item['part_id'])}"
                }
            )

            client = mt.MailtrapClient(token="3b9be2cf27448dc9190be07c489e5e40")
            response = client.send(mail)

            print(response, "\n\n\n\n\nHELLLOOOOO\n\n\n")

        
        # Stockout risks
        risks = self.inventory_service.forecast_stockout_risk(14)
        for risk in risks[:5]:  # Top 5 risks
            if risk['urgency'] in ['CRITICAL', 'HIGH']:
                alerts.append({
                    'alert_type': 'STOCKOUT_RISK',
                    'severity': 'high' if risk['urgency'] == 'CRITICAL' else 'medium',
                    'message': f"{risk['part_name']} will run out in {risk['days_until_stockout']} days",
                    'material_id': risk['part_id'],
                    'action_required': "Review reorder schedule and expedite if necessary",
                    'created_at': datetime.now().isoformat()
                })
        
        return alerts
    
    def _check_email_alerts(self) -> List[Dict]:
        """Check for email-based alerts"""
        alerts = []
        
        try:
            emails = self.email_processor.parse_all_emails()
            critical_emails = self.email_processor.get_critical_emails(emails)
            
            for email in critical_emails:
                severity = 'critical' if email['email_type'] in ['Urgent Alert', 'Order Cancellation'] else 'high'
                
                # Extract relevant info
                extracted = email.get('extracted_info', {})
                material_ids = extracted.get('material_ids', [])
                order_numbers = extracted.get('order_numbers', [])
                
                alerts.append({
                    'alert_type': 'SUPPLIER_ALERT',
                    'severity': severity,
                    'message': f"{email['email_type']}: {email['subject']}",
                    'material_id': material_ids[0] if material_ids else None,
                    'order_id': order_numbers[0] if order_numbers else None,
                    'action_required': f"Review email: {email['filename']} and take appropriate action",
                    'created_at': datetime.now().isoformat(),
                    'details': {
                        'sender': email['sender'],
                        'date': email['date'],
                        'extracted_info': extracted
                    }
                })
        except Exception as e:
            logger.error(f"Error checking email alerts: {e}")
        
        return alerts
    
    def _check_order_alerts(self) -> List[Dict]:
        """Check for order-related alerts"""
        alerts = []
        
        pending_orders = self.csv_processor.get_pending_orders()
        
        if pending_orders.empty:
            return alerts
        
        # Check for overdue orders
        try:
            pending_orders['expected_delivery_date'] = pd.to_datetime(
                pending_orders['expected_delivery_date'], errors='coerce'
            )
            today = pd.Timestamp.now()
            overdue = pending_orders[pending_orders['expected_delivery_date'] < today]
            
            for _, order in overdue.iterrows():
                alerts.append({
                    'alert_type': 'OVERDUE_ORDER',
                    'severity': 'high',
                    'message': f"Order {order['order_id']} for {order['part_id']} is overdue (expected: {order['expected_delivery_date'].date()})",
                    'material_id': order['part_id'],
                    'order_id': order['order_id'],
                    'action_required': f"Contact supplier {order['supplier_id']} for status update",
                    'created_at': datetime.now().isoformat()
                })
        except Exception as e:
            logger.error(f"Error checking overdue orders: {e}")
        
        return alerts
    
    def _check_capacity_alerts(self) -> List[Dict]:
        """Check for build capacity alerts"""
        alerts = []
        
        # Get all available models
        models = self.bom_service.get_all_models()
        
        for model in models:
            capacity = self.bom_service.calculate_build_capacity(model)
            
            if capacity.get('max_units', 0) < 10:
                severity = 'critical' if capacity['max_units'] == 0 else 'high'
                
                bottleneck_parts = [m['part_id'] for m in capacity.get('bottleneck_materials', [])[:3]]
                
                alerts.append({
                    'alert_type': 'LOW_BUILD_CAPACITY',
                    'severity': severity,
                    'message': f"Can only build {capacity['max_units']} units of {model} with current stock",
                    'action_required': f"Review bottleneck materials and reorder: {', '.join(bottleneck_parts)}",
                    'created_at': datetime.now().isoformat(),
                    'details': capacity
                })
        
        return alerts
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """Get a summary of all alerts"""
        alerts = self.generate_alerts()
        
        summary = {
            'total_alerts': len(alerts),
            'by_severity': {
                'critical': len([a for a in alerts if a['severity'] == 'critical']),
                'high': len([a for a in alerts if a['severity'] == 'high']),
                'medium': len([a for a in alerts if a['severity'] == 'medium']),
                'low': len([a for a in alerts if a['severity'] == 'low'])
            },
            'by_type': {},
            'alerts': alerts
        }
        
        # Count by type
        for alert in alerts:
            alert_type = alert['alert_type']
            summary['by_type'][alert_type] = summary['by_type'].get(alert_type, 0) + 1
        
        return summary