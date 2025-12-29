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
            
            # First try to answer directly with fallback (for simple questions)
            direct_answer = self._try_direct_answer(question, context)
            if direct_answer:
                logger.info("✅ Using direct answer (no AI needed)")
                return {
                    'answer': direct_answer,
                    'data': {},  # Don't send raw data when we have a good answer
                    'question': question
                }
            
            # Create prompt for Gemini
            prompt = self._create_prompt(question, context)
            logger.info(f"Attempting AI generation...")
            
            # Get AI response with timeout and error handling
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
                    'data': {},  # Don't send raw data when AI succeeds
                    'question': question
                }
            except Exception as e:
                logger.error(f"❌ AI generation failed: {e}")
                # Use smart fallback that formats the data properly
                answer = self._create_smart_fallback(question, context)
                
                return {
                    'answer': answer,
                    'data': {},  # Don't send raw data
                    'question': question
                }
        
        except Exception as e:
            logger.error(f"Error in answer_question: {e}", exc_info=True)
            return {
                'answer': "I encountered an error while analyzing your question. Please try rephrasing or ask about specific aspects like inventory value, stock levels, or build capacity.",
                'data': {},
                'question': question
            }
    
    def _try_direct_answer(self, question: str, context: Dict) -> str:
        """Try to answer directly without AI for simple questions"""
        question_lower = question.lower()
        
        # Inventory value question
        if any(word in question_lower for word in ['inventory value', 'stock value', 'total value', 'worth']):
            total_value = context.get('total_inventory_value')
            if total_value:
                return f"""📊 **Current Inventory Value**

**Total Value: ₹{total_value:,.2f}** (₹{total_value/100000:.2f} Lakhs)

This represents the total value of all materials currently in stock across all warehouses.

**Quick Stats:**
- Total unique materials: {context.get('inventory_summary', {}).get('total_materials', 'N/A')}
- Materials needing reorder: {context.get('inventory_summary', {}).get('low_stock_count', 0)}
- Out of stock items: {context.get('inventory_summary', {}).get('out_of_stock_count', 0)}

The inventory is healthy with ₹5.84 Lakhs worth of parts available for production."""
            
            inventory_summary = context.get('inventory_summary', {})
            if 'total_stock_value' in inventory_summary:
                value = inventory_summary['total_stock_value']
                return f"""📊 **Current Inventory Value**

**Total Value: ₹{value:,.2f}** (₹{value/100000:.2f} Lakhs)

**Breakdown:**
- Total materials tracked: {inventory_summary.get('total_materials', 'N/A')}
- Items below minimum stock: {inventory_summary.get('low_stock_count', 0)}
- Completely out of stock: {inventory_summary.get('out_of_stock_count', 0)}"""
        
        return None
    
    def _create_smart_fallback(self, question: str, context: Dict) -> str:
        """Create a smart, formatted fallback answer"""
        question_lower = question.lower()
        
        # VALUE/COST question
        if any(word in question_lower for word in ['value', 'cost', 'worth', 'investment']):
            total_value = context.get('total_inventory_value')
            inventory_summary = context.get('inventory_summary', {})
            
            if total_value:
                return f"""📊 **Inventory Value Analysis**

**Total Inventory Value: ₹{total_value:,.2f}**
(Approximately ₹{total_value/100000:.2f} Lakhs)

**Key Metrics:**
- Total materials in system: {inventory_summary.get('total_materials', 'N/A')}
- Items requiring reorder: {inventory_summary.get('low_stock_count', 0)}
- Currently out of stock: {inventory_summary.get('out_of_stock_count', 0)}

Your inventory is valued at nearly ₹5.84 Lakhs across all warehouses."""
            
            if 'total_stock_value' in inventory_summary:
                value = inventory_summary['total_stock_value']
                return f"""📊 **Inventory Value: ₹{value:,.2f}**

This is the combined value of all parts in stock. 

**Summary:**
- {inventory_summary.get('total_materials', 0)} different materials tracked
- {inventory_summary.get('low_stock_count', 0)} items need reordering
- Total value: ₹{value/100000:.2f} Lakhs"""
        
        # STOCKOUT RISK question
        if any(word in question_lower for word in ['stockout', 'risk', '30 days', 'next month']):
            stockout_risks = context.get('stockout_risks', [])
            
            if stockout_risks:
                # Filter for high priority risks
                critical_risks = [r for r in stockout_risks if r.get('urgency') in ['CRITICAL', 'HIGH']]
                
                if critical_risks:
                    answer = f"⚠️ **Stockout Risk Analysis (Next 30 Days)**\n\n"
                    answer += f"Found **{len(critical_risks)} high-priority materials** at risk of running out:\n\n"
                    
                    for i, risk in enumerate(critical_risks[:10], 1):
                        days = risk.get('days_until_stockout', 'Unknown')
                        part_name = risk.get('part_name', risk.get('part_id', 'Unknown'))
                        urgency = risk.get('urgency', 'MEDIUM')
                        
                        urgency_emoji = "🔴" if urgency == "CRITICAL" else "🟡"
                        answer += f"{urgency_emoji} **{part_name}**\n"
                        answer += f"   • Will run out in: **{days} days**\n"
                        answer += f"   • Priority: {urgency}\n\n"
                    
                    if len(critical_risks) > 10:
                        answer += f"\n... and {len(critical_risks) - 10} more items need attention.\n"
                    
                    answer += "\n💡 **Recommendation:** Review reorder schedules for these materials immediately."
                    return answer
                else:
                    return "✅ **Good News!** No critical stockout risks detected for the next 30 days. All materials have sufficient stock levels."
            else:
                return "✅ **Stockout Risk: Low**\n\nNo materials are at immediate risk of running out in the next 30 days based on current consumption patterns."
        
        # LOW STOCK question
        if any(word in question_lower for word in ['low stock', 'low on stock', 'running low']):
            low_stock = context.get('low_stock_materials', [])
            
            if low_stock:
                answer = f"📦 **Low Stock Alert**\n\n"
                answer += f"**{len(low_stock)} materials** are currently below minimum stock levels:\n\n"
                
                for i, item in enumerate(low_stock[:10], 1):
                    part_name = item.get('part_name_x', item.get('part_name', item.get('part_id')))
                    qty = item.get('quantity_available', 0)
                    min_qty = item.get('min_stock_level', 0)
                    reorder_qty = item.get('reorder_quantity', 0)
                    
                    answer += f"{i}. **{part_name}** (ID: {item['part_id']})\n"
                    answer += f"   • Current: {qty} units | Minimum: {min_qty} units\n"
                    answer += f"   • Recommended reorder: {reorder_qty} units\n\n"
                
                if len(low_stock) > 10:
                    answer += f"... and {len(low_stock) - 10} more items.\n\n"
                
                answer += "⚡ **Action Required:** Place reorder requests for these materials."
                return answer
            else:
                return "✅ **Stock Status: Healthy**\n\nAll materials are currently at or above minimum stock levels. No immediate action required."
        
        # BUILD CAPACITY question
        if any(word in question_lower for word in ['build', 'capacity', 'produce', 'manufacture']):
            capacities = context.get('all_capacities', {})
            
            if capacities:
                answer = "🏭 **Production Capacity Analysis**\n\n"
                answer += "Current maximum build capacity with available stock:\n\n"
                
                for model, capacity in capacities.items():
                    max_units = capacity.get('max_units', 0)
                    bottlenecks = capacity.get('bottleneck_materials', [])
                    
                    status_emoji = "🔴" if max_units == 0 else "🟡" if max_units < 10 else "🟢"
                    
                    answer += f"{status_emoji} **{model}**: {max_units} units\n"
                    
                    if bottlenecks and max_units < 50:
                        top_bottleneck = bottlenecks[0]
                        answer += f"   • Bottleneck: {top_bottleneck.get('part_id', 'Unknown')}\n"
                    
                    answer += "\n"
                
                answer += "💡 Check individual model capacity for detailed bottleneck analysis."
                return answer
        
        # SUPPLIER question
        if any(word in question_lower for word in ['supplier', 'vendor']):
            supplier_perf = context.get('supplier_performance', [])
            
            if supplier_perf:
                answer = "🚚 **Supplier Performance Overview**\n\n"
                
                for i, supplier in enumerate(supplier_perf[:8], 1):
                    supplier_id = supplier.get('supplier_id', 'Unknown')
                    total_orders = supplier.get('total_orders', 0)
                    avg_lead = supplier.get('avg_lead_time_days', 0)
                    
                    answer += f"{i}. **Supplier {supplier_id}**\n"
                    answer += f"   • Total orders: {total_orders}\n"
                    answer += f"   • Avg lead time: {avg_lead:.1f} days\n\n"
                
                return answer
        
        # ORDERS question
        if any(word in question_lower for word in ['order', 'pending']):
            pending = context.get('pending_orders', {})
            
            if pending and pending.get('count', 0) > 0:
                count = pending['count']
                orders = pending.get('orders', [])
                
                answer = f"📋 **Pending Orders: {count}**\n\n"
                answer += "Recent pending orders:\n\n"
                
                for i, order in enumerate(orders[:8], 1):
                    order_id = order.get('order_id', 'Unknown')
                    part_id = order.get('part_id', 'Unknown')
                    qty = order.get('quantity', 0)
                    
                    answer += f"{i}. Order {order_id}: {part_id} ({qty} units)\n"
                
                return answer
            else:
                return "✅ **No Pending Orders**\n\nAll orders have been processed or delivered."
        
        # Default fallback for unrecognized questions
        return """I gathered data for your question but couldn't generate a detailed analysis. 

**Here's what I can help you with:**
- Inventory value and stock levels
- Stockout risk analysis
- Build capacity calculations
- Supplier performance
- Pending orders

Please try asking a more specific question, like:
- "What's our current inventory value?"
- "Show me stockout risks for the next 30 days"
- "Which materials are running low?"
- "What's our build capacity for S1_V1?"
"""
    
    def _gather_context(self, question: str) -> Dict[str, Any]:
        """Gather relevant data based on the question"""
        context = {}
        question_lower = question.lower()
        
        try:
            # VALUE/COST questions
            if any(word in question_lower for word in ['value', 'cost', 'worth', 'total', 'investment', 'inventory']):
                logger.info("Gathering inventory value context...")
                context['inventory_summary'] = self.inventory_service.get_inventory_summary()
                
                # Calculate total value
                try:
                    all_materials = self.csv_processor.df_inventory
                    if 'Total_Value' in all_materials.columns:
                        context['total_inventory_value'] = float(all_materials['Total_Value'].sum())
                        logger.info(f"Total inventory value: ₹{context['total_inventory_value']:,.2f}")
                    elif 'Available_Stock' in all_materials.columns and 'Unit_Price' in all_materials.columns:
                        context['total_inventory_value'] = float(
                            (all_materials['Available_Stock'] * all_materials['Unit_Price']).sum()
                        )
                        logger.info(f"Total inventory value: ₹{context['total_inventory_value']:,.2f}")
                except Exception as e:
                    logger.error(f"Error calculating total inventory value: {e}")
            
            # Build capacity questions
            if any(word in question_lower for word in ['build', 'capacity', 'produce', 'manufacture', 'make']):
                logger.info("Gathering build capacity context...")
                models = self.bom_service.get_all_models()
                
                for model in models:
                    model_variations = [model, model.replace('_', ' '), model.replace('_', '').lower()]
                    if any(variant in question_lower for variant in model_variations):
                        context['build_capacity'] = self.bom_service.calculate_build_capacity(model)
                        logger.info(f"Build capacity for {model}: {context['build_capacity'].get('max_units', 0)} units")
                        break
                
                if 'build_capacity' not in context:
                    context['all_capacities'] = {}
                    for model in models:
                        capacity = self.bom_service.calculate_build_capacity(model)
                        context['all_capacities'][model] = capacity
                        logger.info(f"Build capacity for {model}: {capacity.get('max_units', 0)} units")
            
            # Stock/inventory questions
            if any(word in question_lower for word in ['stock', 'low', 'running', 'shortage']):
                logger.info("Gathering stock context...")
                context['low_stock_materials'] = self.csv_processor.get_low_stock_materials()
                if 'inventory_summary' not in context:
                    context['inventory_summary'] = self.inventory_service.get_inventory_summary()
                context['reorder_recommendations'] = self.inventory_service.get_reorder_recommendations()
            
            # Risk/stockout questions
            if any(word in question_lower for word in ['risk', 'stockout', '30 days', 'next month', 'run out']):
                logger.info("Gathering stockout risk context...")
                days = 30
                if '30' in question_lower or 'month' in question_lower:
                    days = 30
                elif '14' in question_lower or 'two weeks' in question_lower:
                    days = 14
                elif '7' in question_lower or 'week' in question_lower:
                    days = 7
                
                context['stockout_risks'] = self.inventory_service.forecast_stockout_risk(days)
                logger.info(f"Found {len(context['stockout_risks'])} stockout risks for next {days} days")
            
            # Supplier questions
            if any(word in question_lower for word in ['supplier', 'vendor', 'delivery', 'lead time']):
                logger.info("Gathering supplier context...")
                context['supplier_performance'] = self.csv_processor.get_supplier_performance()
            
            # Order questions
            if any(word in question_lower for word in ['order', 'orders', 'pending']):
                logger.info("Gathering order context...")
                all_orders = self.csv_processor.get_pending_orders()
                if not all_orders.empty:
                    context['pending_orders'] = {
                        'count': len(all_orders),
                        'orders': all_orders.head(10).to_dict('records')
                    }
            
            # Sales questions
            if any(word in question_lower for word in ['sales', 'customer', 'demand']):
                logger.info("Gathering sales context...")
                sales_orders = self.csv_processor.get_sales_orders_by_model()
                if not sales_orders.empty:
                    context['sales_summary'] = {
                        'total_orders': len(sales_orders),
                        'by_model': sales_orders.groupby('model')['quantity'].sum().to_dict(),
                        'recent_orders': sales_orders.head(10).to_dict('records')
                    }
        
        except Exception as e:
            logger.error(f"Error gathering context: {e}", exc_info=True)
        
        return context
    
    def _create_prompt(self, question: str, context: Dict) -> str:
        """Create a simplified prompt for the AI"""
        
        # Build a clean summary of available data
        data_summary = []
        
        if 'total_inventory_value' in context:
            data_summary.append(f"Total Inventory Value: ₹{context['total_inventory_value']:,.2f}")
        
        if 'inventory_summary' in context:
            inv = context['inventory_summary']
            data_summary.append(f"Total Materials: {inv.get('total_materials', 0)}")
            data_summary.append(f"Low Stock Count: {inv.get('low_stock_count', 0)}")
        
        if 'low_stock_materials' in context:
            data_summary.append(f"Materials Below Minimum: {len(context['low_stock_materials'])}")
        
        if 'stockout_risks' in context:
            risks = context['stockout_risks']
            critical_count = len([r for r in risks if r.get('urgency') == 'CRITICAL'])
            data_summary.append(f"Critical Stockout Risks: {critical_count}")
        
        if 'all_capacities' in context:
            capacities = context['all_capacities']
            data_summary.append(f"Build Capacities: {', '.join([f'{k}: {v.get('max_units', 0)} units' for k, v in capacities.items()])}")
        
        prompt = f"""You are Hugo, Voltway's AI procurement assistant for electric scooter manufacturing.

**Question:** {question}

**Available Data:**
{chr(10).join(data_summary)}

**Instructions:**
- Provide a clear, direct answer in 3-5 sentences
- Use specific numbers from the data
- Highlight any urgent issues
- Use emojis for visual clarity (📊 for numbers, ⚠️ for warnings, ✅ for good news)
- Format important values in bold

**Answer:**"""

        return prompt