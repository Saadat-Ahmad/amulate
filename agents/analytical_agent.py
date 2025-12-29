# agents/analytical_agent.py
import json
from typing import Dict, Any
import google.generativeai as genai
import logging
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

logger = logging.getLogger(__name__)

class AnalyticalAgent:
    """Agent for answering analytical questions about operations"""
    
    def __init__(self, api_key: str, csv_processor, bom_service, inventory_service):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.csv_processor = csv_processor
        self.bom_service = bom_service
        self.inventory_service = inventory_service
    
    async def answer_question(self, question: str) -> Dict[str, Any]:
        """Answer analytical questions using AI and data"""
        
        logger.info(f"🧠 Hugo is analyzing question: {question}")
        
        try:
            # Gather relevant context based on question
            context = self._gather_context(question)
            logger.info(f"Context gathered: {list(context.keys())}")
            
            # ALWAYS try direct answer first - this handles most common questions
            direct_answer = self._create_formatted_answer(question, context)
            
            if direct_answer:
                logger.info("✅ Generated formatted answer")
                return {
                    'answer': direct_answer,
                    'data': {},
                    'question': question
                }
            
            # If no direct answer, try AI
            logger.info("Attempting AI generation...")
            prompt = self._create_prompt(question, context)
            
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.7,
                        max_output_tokens=800
                    )
                )
                answer = response.text
                logger.info("✅ AI response generated successfully")
                
                return {
                    'answer': answer,
                    'data': {},
                    'question': question
                }
            except Exception as e:
                logger.error(f"❌ AI generation failed: {e}")
                # Final fallback
                return {
                    'answer': self._get_generic_help_message(),
                    'data': {},
                    'question': question
                }
        
        except Exception as e:
            logger.error(f"Error in answer_question: {e}", exc_info=True)
            return {
                'answer': "I encountered an error analyzing your question. Please try asking about: inventory value, stock levels, build capacity, or stockout risks.",
                'data': {},
                'question': question
            }
    
    def _create_formatted_answer(self, question: str, context: Dict) -> str:
        """Create a properly formatted answer based on the question type"""
        question_lower = question.lower()
        
        # 1. INVENTORY VALUE
        if any(phrase in question_lower for phrase in ['inventory value', 'stock value', 'total value', 'worth', 'value of inventory']):
            return self._format_inventory_value(context)
        
        # 2. STOCKOUT RISK
        if any(phrase in question_lower for phrase in ['stockout', 'stock out', 'run out', 'risk', '30 days', 'next month']):
            return self._format_stockout_risks(context)
        
        # 3. LOW STOCK
        if any(phrase in question_lower for phrase in ['low stock', 'running low', 'below minimum', 'shortage']):
            return self._format_low_stock(context)
        
        # 4. BUILD CAPACITY
        if any(phrase in question_lower for phrase in ['build capacity', 'produce', 'manufacture', 'production capacity']):
            return self._format_build_capacity(context)
        
        # 5. SUPPLIER PERFORMANCE
        if any(phrase in question_lower for phrase in ['supplier', 'vendor', 'delivery']):
            return self._format_supplier_info(context)
        
        # 6. PENDING ORDERS
        if any(phrase in question_lower for phrase in ['pending order', 'orders', 'order status']):
            return self._format_orders(context)
        
        return None  # No direct answer found, will try AI
    
    def _format_inventory_value(self, context: Dict) -> str:
        """Format inventory value response"""
        total_value = context.get('total_inventory_value')
        inventory_summary = context.get('inventory_summary', {})
        
        if total_value:
            lakhs = total_value / 100000
            return f"""📊 **Current Inventory Value**

**Total Value: ₹{total_value:,.2f}** (₹{lakhs:.2f} Lakhs)

This represents the total value of all materials in stock across all warehouses.

**Key Metrics:**
- Total materials: {inventory_summary.get('total_materials', 'N/A')}
- Materials needing reorder: {inventory_summary.get('low_stock_count', 0)}
- Out of stock items: {inventory_summary.get('out_of_stock_count', 0)}

Your inventory is currently valued at approximately ₹{lakhs:.2f} Lakhs."""
        
        if 'total_stock_value' in inventory_summary:
            value = inventory_summary['total_stock_value']
            lakhs = value / 100000
            return f"""📊 **Inventory Value: ₹{value:,.2f}**

**Total Value: ₹{lakhs:.2f} Lakhs**

**Summary:**
- {inventory_summary.get('total_materials', 0)} different materials tracked
- {inventory_summary.get('low_stock_count', 0)} items need reordering
- {inventory_summary.get('out_of_stock_count', 0)} completely out of stock"""
        
        return None
    
    def _format_stockout_risks(self, context: Dict) -> str:
        """Format stockout risk response"""
        stockout_risks = context.get('stockout_risks', [])
        
        if not stockout_risks:
            return "✅ **Good News!** No stockout risks detected for the next 30 days. All materials have sufficient stock levels."
        
        # Filter critical and high risks
        critical_risks = [r for r in stockout_risks if r.get('urgency') in ['CRITICAL', 'HIGH']]
        
        if not critical_risks:
            return "✅ **Stockout Risk: Low**\n\nNo critical materials are at risk of running out in the next 30 days."
        
        answer = f"⚠️ **Stockout Risk Analysis**\n\n"
        answer += f"Found **{len(critical_risks)} high-priority materials** at risk:\n\n"
        
        for i, risk in enumerate(critical_risks[:10], 1):
            days = risk.get('days_until_stockout', 'Unknown')
            part_name = risk.get('part_name', risk.get('part_id', 'Unknown'))
            urgency = risk.get('urgency', 'MEDIUM')
            part_id = risk.get('part_id', '')
            
            urgency_emoji = "🔴" if urgency == "CRITICAL" else "🟡"
            answer += f"{urgency_emoji} **{part_name}** (ID: {part_id})\n"
            answer += f"   • Will run out in: **{days} days**\n"
            answer += f"   • Priority: {urgency}\n\n"
        
        if len(critical_risks) > 10:
            answer += f"\n... and {len(critical_risks) - 10} more items.\n"
        
        answer += "\n💡 **Recommendation:** Review reorder schedules immediately for these materials."
        return answer
    
    def _format_low_stock(self, context: Dict) -> str:
        """Format low stock response"""
        low_stock = context.get('low_stock_materials', [])
        
        if not low_stock:
            return "✅ **Stock Status: Healthy**\n\nAll materials are at or above minimum stock levels. No immediate action required."
        
        answer = f"📦 **Low Stock Alert**\n\n"
        answer += f"**{len(low_stock)} materials** are below minimum stock levels:\n\n"
        
        for i, item in enumerate(low_stock[:10], 1):
            part_name = item.get('part_name_x', item.get('part_name', item.get('part_id')))
            qty = item.get('quantity_available', 0)
            min_qty = item.get('min_stock_level', 0)
            reorder_qty = item.get('reorder_quantity', 0)
            part_id = item.get('part_id', '')
            
            answer += f"**{i}. {part_name}** (ID: {part_id})\n"
            answer += f"   • Current: {qty} units | Minimum: {min_qty} units\n"
            answer += f"   • Recommended reorder: {reorder_qty} units\n\n"
        
        if len(low_stock) > 10:
            answer += f"... and {len(low_stock) - 10} more items.\n\n"
        
        answer += "⚡ **Action:** Place reorder requests for these materials."
        return answer
    
    def _format_build_capacity(self, context: Dict) -> str:
        """Format build capacity response"""
        
        # Check for specific model capacity
        if 'build_capacity' in context:
            capacity = context['build_capacity']
            max_units = capacity.get('max_units', 0)
            bottlenecks = capacity.get('bottleneck_materials', [])
            
            status_emoji = "🔴" if max_units == 0 else "🟡" if max_units < 10 else "🟢"
            
            answer = f"{status_emoji} **Build Capacity Analysis**\n\n"
            answer += f"Maximum units with current stock: **{max_units} units**\n\n"
            
            if bottlenecks and len(bottlenecks) > 0:
                answer += "**Bottleneck Materials:**\n"
                for i, btl in enumerate(bottlenecks[:5], 1):
                    part_id = btl.get('part_id', 'Unknown')
                    available = btl.get('available', 0)
                    required = btl.get('required_per_unit', 0)
                    answer += f"{i}. {part_id}: {available} available (need {required} per unit)\n"
            
            return answer
        
        # All models capacity
        capacities = context.get('all_capacities', {})
        
        if not capacities:
            return "Unable to calculate build capacity. Please check BOM data."
        
        answer = "🏭 **Production Capacity**\n\n"
        answer += "Maximum units per model with current stock:\n\n"
        
        for model, capacity in capacities.items():
            max_units = capacity.get('max_units', 0)
            status_emoji = "🔴" if max_units == 0 else "🟡" if max_units < 10 else "🟢"
            answer += f"{status_emoji} **{model}**: {max_units} units\n"
        
        answer += "\n💡 Ask about a specific model for detailed bottleneck analysis."
        return answer
    
    def _format_supplier_info(self, context: Dict) -> str:
        """Format supplier information"""
        supplier_perf = context.get('supplier_performance', [])
        
        if not supplier_perf:
            return "No supplier performance data available."
        
        answer = "🚚 **Supplier Performance**\n\n"
        
        for i, supplier in enumerate(supplier_perf[:8], 1):
            supplier_id = supplier.get('supplier_id', 'Unknown')
            total_orders = supplier.get('total_orders', 0)
            avg_lead = supplier.get('avg_lead_time_days', 0)
            
            answer += f"**{i}. Supplier {supplier_id}**\n"
            answer += f"   • Orders: {total_orders}\n"
            answer += f"   • Avg lead time: {avg_lead:.1f} days\n\n"
        
        return answer
    
    def _format_orders(self, context: Dict) -> str:
        """Format pending orders"""
        pending = context.get('pending_orders', {})
        
        if not pending or pending.get('count', 0) == 0:
            return "✅ **No Pending Orders**\n\nAll orders have been delivered or are in transit."
        
        count = pending['count']
        orders = pending.get('orders', [])
        
        answer = f"📋 **Pending Orders: {count}**\n\n"
        
        for i, order in enumerate(orders[:10], 1):
            order_id = order.get('order_id', 'Unknown')
            part_id = order.get('part_id', 'Unknown')
            qty = order.get('quantity', 0)
            expected = order.get('expected_delivery_date', 'Unknown')
            
            answer += f"**{i}. Order {order_id}**\n"
            answer += f"   • Part: {part_id}\n"
            answer += f"   • Quantity: {qty} units\n"
            answer += f"   • Expected: {expected}\n\n"
        
        if count > 10:
            answer += f"... and {count - 10} more orders.\n"
        
        return answer
    
    def _get_generic_help_message(self) -> str:
        """Return a generic help message"""
        return """I'm having trouble analyzing your question right now. 

**I can help you with:**
- 📊 Inventory value and total stock worth
- ⚠️ Stockout risks and forecasts
- 📦 Low stock alerts and reorder recommendations
- 🏭 Build capacity for scooter models
- 🚚 Supplier performance and lead times
- 📋 Pending orders status

**Try asking:**
- "What's our current inventory value?"
- "Show me stockout risks for the next 30 days"
- "Which materials are running low?"
- "What's our build capacity for S1_V1?"
- "How are our suppliers performing?"
"""
    
    def _gather_context(self, question: str) -> Dict[str, Any]:
        """Gather relevant data based on the question"""
        context = {}
        question_lower = question.lower()
        
        try:
            # VALUE questions
            if any(word in question_lower for word in ['value', 'cost', 'worth', 'total', 'investment']):
                logger.info("Gathering inventory value...")
                context['inventory_summary'] = self.inventory_service.get_inventory_summary()
                
                try:
                    all_materials = self.csv_processor.df_inventory
                    if 'Total_Value' in all_materials.columns:
                        context['total_inventory_value'] = float(all_materials['Total_Value'].sum())
                    elif 'Available_Stock' in all_materials.columns and 'Unit_Price' in all_materials.columns:
                        context['total_inventory_value'] = float(
                            (all_materials['Available_Stock'] * all_materials['Unit_Price']).sum()
                        )
                except Exception as e:
                    logger.error(f"Error calculating value: {e}")
            
            # BUILD CAPACITY
            if any(word in question_lower for word in ['build', 'capacity', 'produce', 'manufacture']):
                logger.info("Gathering build capacity...")
                models = self.bom_service.get_all_models()
                
                # Check for specific model
                specific_model = None
                for model in models:
                    if model.lower().replace('_', '') in question_lower.replace(' ', ''):
                        specific_model = model
                        break
                
                if specific_model:
                    context['build_capacity'] = self.bom_service.calculate_build_capacity(specific_model)
                else:
                    context['all_capacities'] = {}
                    for model in models:
                        context['all_capacities'][model] = self.bom_service.calculate_build_capacity(model)
            
            # LOW STOCK
            if any(word in question_lower for word in ['low', 'stock', 'running', 'shortage']):
                logger.info("Gathering low stock...")
                context['low_stock_materials'] = self.csv_processor.get_low_stock_materials()
                if 'inventory_summary' not in context:
                    context['inventory_summary'] = self.inventory_service.get_inventory_summary()
            
            # STOCKOUT RISKS
            if any(word in question_lower for word in ['risk', 'stockout', 'run out', '30 days', 'month']):
                logger.info("Gathering stockout risks...")
                days = 30
                if '7' in question_lower or 'week' in question_lower:
                    days = 7
                elif '14' in question_lower:
                    days = 14
                
                context['stockout_risks'] = self.inventory_service.forecast_stockout_risk(days)
            
            # SUPPLIERS
            if any(word in question_lower for word in ['supplier', 'vendor', 'delivery', 'lead']):
                logger.info("Gathering supplier data...")
                context['supplier_performance'] = self.csv_processor.get_supplier_performance()
            
            # ORDERS
            if any(word in question_lower for word in ['order', 'pending']):
                logger.info("Gathering orders...")
                all_orders = self.csv_processor.get_pending_orders()
                if not all_orders.empty:
                    context['pending_orders'] = {
                        'count': len(all_orders),
                        'orders': all_orders.head(10).to_dict('records')
                    }
        
        except Exception as e:
            logger.error(f"Error gathering context: {e}", exc_info=True)
        
        return context
    
    def _create_prompt(self, question: str, context: Dict) -> str:
        """Create AI prompt as last resort"""
        
        data_summary = []
        
        if 'total_inventory_value' in context:
            data_summary.append(f"Inventory Value: ₹{context['total_inventory_value']:,.2f}")
        
        if 'low_stock_materials' in context:
            data_summary.append(f"Low Stock Items: {len(context['low_stock_materials'])}")
        
        if 'stockout_risks' in context:
            critical = len([r for r in context['stockout_risks'] if r.get('urgency') == 'CRITICAL'])
            data_summary.append(f"Critical Stockout Risks: {critical}")
        
        prompt = f"""You are Hugo, an AI assistant for Voltway electric scooters.

Question: {question}

Data: {', '.join(data_summary)}

Provide a clear, helpful answer in 2-3 sentences using emojis and formatting."""

        return prompt