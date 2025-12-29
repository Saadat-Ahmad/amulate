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
            
            # Create prompt for Gemini
            prompt = self._create_prompt(question, context)
            
            # Get AI response
            try:
                response = self.model.generate_content(prompt)
                answer = response.text
            except Exception as e:
                logger.error(f"Error generating AI response: {e}")
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
    
    def _create_fallback_answer(self, question: str, context: Dict) -> str:
        """Create a fallback answer based on context when AI fails"""
        question_lower = question.lower()
        
        # Low stock question
        if 'low' in question_lower and 'stock' in question_lower:
            low_stock = context.get('low_stock_materials', [])
            if low_stock:
                answer = f"Based on current inventory data, we have {len(low_stock)} materials running low on stock:\n\n"
                for item in low_stock[:10]:
                    part_name = item.get('part_name', item.get('part_id'))
                    qty = item.get('quantity_available', 0)
                    min_qty = item.get('min_stock_level', 0)
                    answer += f"• {part_name} (ID: {item['part_id']}): {qty} units available (minimum: {min_qty})\n"
                return answer
            else:
                return "Good news! No materials are currently running low on stock. All inventory levels are adequate."
        
        # Build capacity question
        if 'build' in question_lower or 'capacity' in question_lower:
            capacities = context.get('all_capacities', {})
            if capacities:
                answer = "Current build capacity for all scooter models:\n\n"
                for model, capacity in capacities.items():
                    max_units = capacity.get('max_units', 0)
                    answer += f"• {model}: {max_units} units\n"
                return answer
        
        # Default fallback
        return "I have gathered the relevant data but couldn't generate a detailed analysis. Please check the data section below."
    
    def _gather_context(self, question: str) -> Dict[str, Any]:
        """Gather relevant data based on the question"""
        context = {}
        question_lower = question.lower()
        
        try:
            # Build capacity questions
            if any(word in question_lower for word in ['build', 'capacity', 'produce', 'manufacture', 'make']):
                # Check if specific model mentioned
                models = self.bom_service.get_all_models()
                
                for model in models:
                    model_variations = [model, model.replace('_', ' '), model.replace('_', '').lower()]
                    if any(variant in question_lower for variant in model_variations):
                        context['build_capacity'] = self.bom_service.calculate_build_capacity(model)
                        break
                
                # If no specific model, get capacity for all models
                if 'build_capacity' not in context:
                    context['all_capacities'] = {}
                    for model in models:
                        capacity = self.bom_service.calculate_build_capacity(model)
                        context['all_capacities'][model] = capacity
            
            # Stock/inventory questions
            if any(word in question_lower for word in ['stock', 'inventory', 'low', 'running', 'shortage']):
                context['low_stock_materials'] = self.csv_processor.get_low_stock_materials()
                context['inventory_summary'] = self.inventory_service.get_inventory_summary()
                context['reorder_recommendations'] = self.inventory_service.get_reorder_recommendations()
            
            # Supplier questions
            if any(word in question_lower for word in ['supplier', 'vendor', 'delivery', 'lead time']):
                context['supplier_performance'] = self.csv_processor.get_supplier_performance()
            
            # Order questions
            if any(word in question_lower for word in ['order', 'orders', 'pending']):
                all_orders = self.csv_processor.get_pending_orders()
                if not all_orders.empty:
                    context['pending_orders'] = {
                        'count': len(all_orders),
                        'orders': all_orders.head(10).to_dict('records')
                    }
            
            # Sales questions
            if any(word in question_lower for word in ['sales', 'customer', 'demand']):
                sales_orders = self.csv_processor.get_sales_orders_by_model()
                if not sales_orders.empty:
                    context['sales_summary'] = {
                        'total_orders': len(sales_orders),
                        'by_model': sales_orders.groupby('model')['quantity'].sum().to_dict(),
                        'recent_orders': sales_orders.head(10).to_dict('records')
                    }
            
            # Risk/bottleneck questions
            if any(word in question_lower for word in ['risk', 'bottleneck', 'problem', 'issue', 'concern']):
                context['stockout_risks'] = self.inventory_service.forecast_stockout_risk(30)
                stock_health = self.inventory_service.analyze_stock_health()
                context['stock_health'] = stock_health[:10] if stock_health else []
        
        except Exception as e:
            logger.error(f"Error gathering context: {e}", exc_info=True)
        
        return context
    
    def _create_prompt(self, question: str, context: Dict) -> str:
        """Create a detailed prompt for the AI"""
        
        # Simplify context for the prompt
        simplified_context = {}
        for key, value in context.items():
            if isinstance(value, list):
                simplified_context[key] = f"List with {len(value)} items"
            elif isinstance(value, dict):
                simplified_context[key] = f"Object with {len(value)} properties"
            else:
                simplified_context[key] = value
        
        prompt = f"""You are Hugo, an intelligent AI procurement assistant for Voltway, an electric scooter manufacturing company.

**User Question:** {question}

**Available Data:** {json.dumps(simplified_context, indent=2)}

**Your Task:**
1. Answer the user's question directly and clearly
2. Use specific numbers and data from the context
3. Highlight any risks or concerns
4. Be concise but informative
5. If data shows issues, prioritize those in your response

**Response Guidelines:**
- Start with a direct answer
- Use bullet points for lists
- Be specific with numbers
- Keep it under 200 words unless more detail is needed

**Answer:**"""

        return prompt