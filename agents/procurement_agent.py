# agents/procurement_agent.py
from typing import TypedDict, List, Dict, Annotated
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI  # Changed
from langchain_core.messages import SystemMessage, HumanMessage
import json
import os
from supplier_service import SupplierService

# Define the state that flows through the graph
class ProcurementState(TypedDict):
    user_query: str
    user_requirements: Dict
    suppliers_data: List[Dict]
    selected_supplier: Dict
    market_analysis: Dict
    optimal_price: float
    profit_margin: float
    decision: str
    messages: Annotated[list, "Messages in the conversation"]

class ProcurementAgent:
    def __init__(self):
        # Initialize Google Generative AI (Gemini)
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",  # or "gemini-1.5-pro" for better quality
            temperature=0.3,
            google_api_key=api_key,
            convert_system_message_to_human=True  # Gemini doesn't support system messages natively
        )
        
        self.supplier_service = SupplierService()
        self.graph = self._build_graph()
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        from langgraph.graph import StateGraph, END
        
        workflow = StateGraph(ProcurementState)
        
        # Add nodes
        workflow.add_node("analyze_needs", self.analyze_user_needs)
        workflow.add_node("fetch_suppliers", self.fetch_suppliers)
        workflow.add_node("compare_suppliers", self.compare_suppliers)
        workflow.add_node("analyze_market", self.analyze_market)
        workflow.add_node("calculate_price", self.calculate_dynamic_price)
        workflow.add_node("make_decision", self.make_decision)
        
        # Define the flow
        workflow.set_entry_point("analyze_needs")
        workflow.add_edge("analyze_needs", "fetch_suppliers")
        workflow.add_edge("fetch_suppliers", "compare_suppliers")
        workflow.add_edge("compare_suppliers", "analyze_market")
        workflow.add_edge("analyze_market", "calculate_price")
        workflow.add_edge("calculate_price", "make_decision")
        workflow.add_edge("make_decision", END)
        
        # Compile with specific config
        return workflow.compile()
    
    async def analyze_user_needs(self, state: ProcurementState) -> ProcurementState:
        """Extract structured requirements from user query using LLM"""
        print("\n🔍 Step 1: Analyzing user needs...")
        
        # Gemini works better with combined system + user messages
        prompt = f"""You are a procurement assistant AI. Analyze the following user query and extract structured requirements.

User Query: "{state['user_query']}"

Extract the following information and return it in valid JSON format:
- product_category: What type of product (e.g., "screen protector", "phone case")
- product_name: Specific product name or model if mentioned
- quantity: How many units needed (default: 1)
- budget_min: Minimum budget in INR (if mentioned, otherwise null)
- budget_max: Maximum budget in INR (if mentioned, otherwise null)
- quality_requirements: Any quality preferences (e.g., "premium", "budget-friendly")
- delivery_preferences: Delivery speed requirements (e.g., "fast", "standard")
- other_requirements: Any other specific requirements

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no code blocks, no explanations. Just pure JSON."""

        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        
        try:
            # Clean the response (Gemini sometimes adds markdown)
            content = response.content.strip()
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()
            
            requirements = json.loads(content)
            state['user_requirements'] = requirements
            print(f"✅ Requirements extracted: {requirements.get('product_name', 'Unknown product')}")
        except json.JSONDecodeError as e:
            print(f"⚠️  JSON parsing error: {e}")
            print(f"Response was: {response.content[:200]}...")
            # Fallback parsing
            state['user_requirements'] = {
                "product_category": "electronics",
                "product_name": state['user_query'],
                "quantity": 1,
                "budget_max": 10000
            }
            print("⚠️  Using fallback requirements")
        
        return state
    
    async def fetch_suppliers(self, state: ProcurementState) -> ProcurementState:
        """Fetch supplier data from APIs"""
        print("\n📦 Step 2: Fetching suppliers...")
        
        requirements = state['user_requirements']
        search_query = requirements.get('product_name', state['user_query'])
        
        # Fetch from supplier service
        suppliers = await self.supplier_service.fetch_suppliers(search_query)
        
        state['suppliers_data'] = suppliers
        print(f"✅ Found {len(suppliers)} suppliers")
        
        return state
    
    async def compare_suppliers(self, state: ProcurementState) -> ProcurementState:
        """Use LLM to compare and select best supplier"""
        print("\n⚖️  Step 3: Comparing suppliers...")
        
        # Prepare supplier data for LLM
        suppliers_summary = []
        for idx, supplier in enumerate(state['suppliers_data'][:5], 1):  # Top 5
            suppliers_summary.append({
                "id": idx,
                "title": supplier.get('title', '')[:100],
                "price": supplier.get('price', 0),
                "original_price": supplier.get('price_strikethrough'),
                "rating": supplier.get('rating', 0),
                "reviews": supplier.get('reviews_count', 0),
                "is_prime": supplier.get('is_prime', False),
                "shipping": supplier.get('shipping_information', ''),
                "availability_score": supplier.get('availability_score', 0)
            })
        
        prompt = f"""You are a procurement expert AI. Select the BEST supplier from the options below.

User Requirements: 
{json.dumps(state['user_requirements'], indent=2)}

Available Suppliers:
{json.dumps(suppliers_summary, indent=2)}

Evaluation Criteria (in order of importance):
1. Price competitiveness (within budget)
2. Product quality indicators (rating, reviews)
3. Delivery speed (Prime, free delivery)
4. Availability and reliability
5. Value for money (discount percentage)

Analyze each supplier and select the best one. Return your response as valid JSON with:
- selected_id: The ID of the best supplier (1-5)
- selection_reason: Brief explanation in 2-3 sentences
- confidence_score: Your confidence in this selection (0-100)

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, just pure JSON."""

        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        
        try:
            # Clean the response
            content = response.content.strip()
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()
            
            selection = json.loads(content)
            selected_id = selection['selected_id'] - 1  # Convert to 0-indexed
            
            state['selected_supplier'] = state['suppliers_data'][selected_id].copy()
            state['selected_supplier']['selection_reason'] = selection['selection_reason']
            state['selected_supplier']['confidence_score'] = selection['confidence_score']
            
            print(f"✅ Selected supplier: {state['selected_supplier'].get('title', 'N/A')[:60]}...")
            
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            print(f"⚠️  Selection error: {e}")
            print(f"Response was: {response.content[:200]}...")
            # Fallback: select cheapest with good rating
            state['selected_supplier'] = min(
                state['suppliers_data'],
                key=lambda x: x.get('price', float('inf'))
            )
            state['selected_supplier']['selection_reason'] = "Selected based on lowest price (fallback)"
            print("⚠️  Using fallback selection")
        
        return state
    
    async def analyze_market(self, state: ProcurementState) -> ProcurementState:
        """Analyze market prices"""
        print("\n📊 Step 4: Analyzing market...")
        
        # Calculate market statistics
        prices = [s.get('price', 0) for s in state['suppliers_data'] if s.get('price', 0) > 0]
        
        if prices:
            market_analysis = {
                "average_price": sum(prices) / len(prices),
                "min_price": min(prices),
                "max_price": max(prices),
                "median_price": sorted(prices)[len(prices) // 2],
                "total_suppliers": len(prices),
                "position": "competitive"
            }
        else:
            market_analysis = {
                "average_price": state['selected_supplier'].get('price', 0),
                "min_price": state['selected_supplier'].get('price', 0),
                "max_price": state['selected_supplier'].get('price', 0),
                "median_price": state['selected_supplier'].get('price', 0),
                "total_suppliers": 1,
                "position": "unknown"
            }
        
        state['market_analysis'] = market_analysis
        print(f"✅ Market average: ₹{market_analysis['average_price']:.2f}")
        
        return state
    
    async def calculate_dynamic_price(self, state: ProcurementState) -> ProcurementState:
        """Calculate optimal selling price using AI"""
        print("\n💰 Step 5: Calculating dynamic price...")
        
        purchase_price = state['selected_supplier'].get('price', 0)
        market_avg = state['market_analysis']['average_price']
        
        prompt = f"""You are a pricing strategist AI. Calculate the optimal selling price for this product.

Purchase Price: ₹{purchase_price}
Market Average: ₹{market_avg:.2f}
Market Range: ₹{state['market_analysis']['min_price']} - ₹{state['market_analysis']['max_price']}

Consider these factors:
- Target profit margin: 15-25%
- Stay competitive with market
- Account for operational costs (~5%)
- Pricing psychology (prices ending in 9, 99, etc. sell better)

Calculate the optimal selling price and return valid JSON with:
- optimal_price: Recommended selling price as a number (e.g., 6599.00)
- profit_margin: Percentage profit as a number (e.g., 20.5)
- reasoning: Brief explanation of your pricing decision

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, just pure JSON."""

        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        
        try:
            # Clean the response
            content = response.content.strip()
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()
            
            pricing = json.loads(content)
            state['optimal_price'] = float(pricing['optimal_price'])
            state['profit_margin'] = float(pricing['profit_margin'])
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"⚠️  Pricing error: {e}")
            print(f"Response was: {response.content[:200]}...")
            # Fallback: 20% markup
            state['optimal_price'] = purchase_price * 1.20
            state['profit_margin'] = 20.0
            print("⚠️  Using fallback pricing (20% markup)")
        
        print(f"✅ Optimal price: ₹{state['optimal_price']:.2f} ({state['profit_margin']:.1f}% margin)")
        
        return state
    
    async def make_decision(self, state: ProcurementState) -> ProcurementState:
        """Generate final procurement decision"""
        print("\n✅ Step 6: Making final decision...")
        
        selected = state['selected_supplier']
        purchase_price = selected.get('price', 0)
        selling_price = state['optimal_price']
        profit = selling_price - purchase_price
        
        decision = f"""
PROCUREMENT RECOMMENDATION
{'=' * 50}

SELECTED SUPPLIER:
  Product: {selected.get('title', 'N/A')[:80]}
  Purchase Price: ₹{purchase_price:,.2f}
  Rating: {selected.get('rating', 0)}⭐ ({selected.get('reviews_count', 0)} reviews)
  Delivery: {selected.get('shipping_information', 'N/A')}
  Reason: {selected.get('selection_reason', 'Best overall value')}

PRICING STRATEGY:
  Recommended Selling Price: ₹{selling_price:,.2f}
  Expected Profit: ₹{profit:,.2f}
  Profit Margin: {state['profit_margin']:.2f}%
  
MARKET POSITION:
  Market Average: ₹{state['market_analysis']['average_price']:,.2f}
  Our Price vs Market: {((selling_price / state['market_analysis']['average_price'] - 1) * 100):+.1f}%
  Competitiveness: {"✅ Competitive" if selling_price <= state['market_analysis']['average_price'] else "⚠️  Premium"}

RECOMMENDATION: {"✅ PROCEED" if state['profit_margin'] >= 15 else "⚠️  REVIEW NEEDED"}
"""
        
        state['decision'] = decision
        print("✅ Decision generated")
        
        return state
    
    async def run(self, user_query: str) -> Dict:
        """Execute the procurement agent workflow"""
        initial_state = {
            "user_query": user_query,
            "user_requirements": {},
            "suppliers_data": [],
            "selected_supplier": {},
            "market_analysis": {},
            "optimal_price": 0.0,
            "profit_margin": 0.0,
            "decision": "",
            "messages": []
        }
        
        result = await self.graph.ainvoke(initial_state)
        return result