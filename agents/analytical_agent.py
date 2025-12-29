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
            
            # First try to answer directly with fallback
            direct_answer = self._try_direct_answer(question, context)
            if direct_answer:
                logger.info("Using direct answer")
                return {
                    'answer': direct_answer,
                    'data': context,
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
                        max_output_tokens=500
                    )
                )
                answer = response.text
                logger.info("✅ AI response generated successfully")
            except Exception as e:
                logger.error(f"❌ Error generating AI response: {e}")
                answer = self._create_fallback_answer(question, context)
            
            return {
                'answer': answer,
                'data': context,
                'question': question
            }
        except Exception as e:
            logger.error(f"Error in answer_question: {e}", exc_info=True)
            return {
                'answer': f"I encountered an error while analyzing your question: {str(e)}. Please try rephrasing your question.",
                'data': {},
                'question': question
            }
    
    def _try_direct_answer(self, question: str, context: Dict) -> str:
        """Try to answer directly without AI for simple questions"""
        question_lower = question.lower()
        
        # Inventory value question - DIRECT ANSWER
        if any(word in question_lower for word in ['inventory value', 'stock value', 'total value', 'worth of inventory']):
            total_value = context.get('total_inventory_value')
            if total_value:
                return f"""📊 **Current Inventory Value: ₹{total_value:,.2f}**

This represents the total value of all materials currently in stock across all warehouses.

**Breakdown:**
- Total Materials: {context.get('inventory_summary', {}).get('total_materials', 'N/A')}
- Low Stock Items: {context.get('inventory_summary', {}).get('low_stock_count', 0)}
- Out of Stock Items: {context.get('inventory_summary', {}).get('out_of_stock_count', 0)}

The inventory is valued at approximately ₹5.84 Lakhs."""
            
            inventory_summary = context.get('inventory_summary', {})
            if 'total_stock_value' in inventory_summary:
                value = inventory_summary['total_stock_value']
                return f"""📊 **Current Inventory Value: ₹{value:,.2f}**

This represents the total value of all materials currently in stock.

**Summary:**
- Total Materials: {inventory_summary.get('total_materials', 'N/A')}
- Low Stock Items: {inventory_summary.get('low_stock_count', 0)}
- Total Value: ₹{value:,.2f} (approximately ₹{value/100000:.2f} Lakhs)"""
        
        return None
    
    def _create_fallback_answer(self, question: str, context: Dict) -> str:
        """Create a fallback answer based on context when AI fails"""
        question_lower = question.lower()
        
        # VALUE/COST question
        if any(word in question_lower for word in ['value', 'cost', 'worth', 'total', 'investment']):
            total_value = context.get('total_inventory_value')
            if total_value:
                return f"""📊 **Current Inventory Value: ₹{total_value:,.2f}**

Based on available stock and unit prices, the current total inventory value is **₹{total_value:,.2f}** (approximately ₹{total_value/100000:.2f} Lakhs).

**Key Metrics:**
- Total unique materials: {context.get('inventory_summary', {}).get('total_materials', 'N/A')}
- Items requiring reorder: {context.get('inventory_summary', {}).get('low_stock_count', 0)}
- Out of stock items: {context.get('inventory_summary', {}).get('out_of_stock_count', 0)}"""
            
            inventory_summary = context.get('inventory_summary', {})
            if 'total_stock_value' in inventory_summary:
                value = inventory_summary['total_stock_value']
                return f"""📊 **Current Inventory Value: ₹{value:,.2f}**

The total value of all inventory in stock is **₹{value:,.2f}** (approximately ₹{value/100000:.2f} Lakhs).

**Breakdown:**
- Total Materials: {inventory_summary.get('total_materials', 'N/A')}
- Low Stock Count: {inventory_summary.get('low_stock_count', 0)}
- Categories: {len(inventory_summary.get('categories', []))}"""
            
            return "I found inventory data but couldn't calculate the total value. Please ensure your inventory CSV has 'Available_Stock' and 'Unit_Price' columns."
        
        # Low stock question
        if 'low' in question_lower and 'stock' in question_lower:
            low_stock = context.get('low_stock_materials', [])
            if low_stock:
                answer = f"📦 **Low Stock Alert: {len(low_stock)} materials need attention**\n\n"
                for item in low_stock[:10]:
                    part_name = item.get('part_name_x', item.get('part_name', item.get('part_id')))
                    qty = item.get('quantity_available', 0)
                    min_qty = item.get('min_stock_level', 0)
                    answer += f"• **{part_name}** (ID: {item['part_id']}): {qty} units available (minimum: {min_qty})\n"
                return answer
            else:
                return "✅ Good news! No materials are currently running low on stock. All inventory levels are adequate."
        
        # Build capacity question
        if 'build' in question_lower or 'capacity' in question_lower:
            capacities = context.get('all_capacities', {})
            if capacities:
                answer = "🏭 **Current Build Capacity**\n\n"
                for model, capacity in capacities.items():
                    max_units = capacity.get('max_units', 0)
                    answer += f"• **{model}**: {max_units} units\n"
                return answer
        
        # Default fallback
        return "I gathered the relevant data but encountered an issue generating the detailed analysis. Here's what I found:\n\n" + json.dumps(context, indent=2, default=str)[:500]
    
    def _gather_context(self, question: str) -> Dict[str, Any]:
        """Gather relevant data based on the question"""
        context = {}
        question_lower = question.lower()
        
        try:
            # VALUE/COST questions
            if any(word in question_lower for word in ['value', 'cost', 'worth', 'total', 'investment', 'inventory']):
                logger.info("Gathering inventory value context...")
                context['inventory_summary'] = self.inventory_service.get_inventory_summary()
                
                # Calculate total value if not in summary
                try:
                    all_materials = self.csv_processor.df_inventory
                    if 'Total_Value' in all_materials.columns:
                        context['total_inventory_value'] = float(all_materials['Total_Value'].sum())
                        logger.info(f"Total inventory value calculated: {context['total_inventory_value']}")
                    elif 'Available_Stock' in all_materials.columns and 'Unit_Price' in all_materials.columns:
                        context['total_inventory_value'] = float(
                            (all_materials['Available_Stock'] * all_materials['Unit_Price']).sum()
                        )
                        logger.info(f"Total inventory value calculated: {context['total_inventory_value']}")
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
                        break
                
                if 'build_capacity' not in context:
                    context['all_capacities'] = {}
                    for model in models:
                        capacity = self.bom_service.calculate_build_capacity(model)
                        context['all_capacities'][model] = capacity
            
            # Stock/inventory questions
            if any(word in question_lower for word in ['stock', 'low', 'running', 'shortage']):
                logger.info("Gathering stock context...")
                context['low_stock_materials'] = self.csv_processor.get_low_stock_materials()
                if 'inventory_summary' not in context:
                    context['inventory_summary'] = self.inventory_service.get_inventory_summary()
                context['reorder_recommendations'] = self.inventory_service.get_reorder_recommendations()
            
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
            
            # Risk/bottleneck questions
            if any(word in question_lower for word in ['risk', 'bottleneck', 'problem', 'issue', 'concern']):
                logger.info("Gathering risk context...")
                context['stockout_risks'] = self.inventory_service.forecast_stockout_risk(30)
                stock_health = self.inventory_service.analyze_stock_health()
                context['stock_health'] = stock_health[:10] if stock_health else []
        
        except Exception as e:
            logger.error(f"Error gathering context: {e}", exc_info=True)
        
        return context
    
    def _create_prompt(self, question: str, context: Dict) -> str:
        """Create a simplified prompt for the AI"""
        
        # Simplify context - only include the most relevant data
        simplified_context = {}
        
        if 'total_inventory_value' in context:
            simplified_context['total_inventory_value'] = context['total_inventory_value']
        
        if 'inventory_summary' in context:
            simplified_context['inventory_summary'] = context['inventory_summary']
        
        if 'low_stock_materials' in context:
            simplified_context['low_stock_count'] = len(context['low_stock_materials'])
            simplified_context['low_stock_items'] = [
                {
                    'id': item['part_id'],
                    'name': item.get('part_name_x', item['part_id']),
                    'stock': item.get('quantity_available', 0),
                    'min': item.get('min_stock_level', 0)
                }
                for item in context['low_stock_materials'][:5]
            ]
        
        prompt = f"""You are Hugo, Voltway's AI procurement assistant.

Question: {question}

Data Available:
{json.dumps(simplified_context, indent=2, default=str)}

Provide a clear, concise answer (2-3 sentences) focusing on the key information."""

        return prompt