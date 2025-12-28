# agents/procurement_agent_simple.py
from typing import Dict, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import json
import os
from supplier_service import SupplierService

class ProcurementAgent:
    def __init__(self):
        # Initialize Google Generative AI (Gemini)
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.3,
            google_api_key=api_key,
            convert_system_message_to_human=True
        )
        
        self.supplier_service = SupplierService()
    
    def _clean_json_response(self, content: str) -> str:
        """Clean markdown formatting from Gemini responses"""
        content = content.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
            content = content.replace("```", "").strip()
        return content
    
    async def analyze_user_needs(self, user_query: str) -> Dict:
        """Extract structured requirements from user query"""
        print("\n🔍 Step 1: Analyzing user needs...")
        
        prompt = f"""You are a procurement assistant AI. Analyze the following user query and extract structured requirements.

User Query: "{user_query}"

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
            content = self._clean_json_response(response.content)
            requirements = json.loads(content)
            print(f"✅ Requirements extracted: {requirements.get('product_name', 'Unknown product')}")
            return requirements
        except json.JSONDecodeError as e:
            print(f"⚠️  JSON parsing error: {e}")
            print(f"Response was: {response.content[:200]}...")
            return {
                "product_category": "electronics",
                "product_name": user_query,
                "quantity": 1,
                "budget_max": 10000
            }
    
    async def fetch_suppliers(self, requirements: Dict) -> List[Dict]:
        """Fetch supplier data"""
        print("\n📦 Step 2: Fetching suppliers...")
        
        search_query = requirements.get('product_name', 'product')
        suppliers = await self.supplier_service.fetch_suppliers(search_query)
        
        print(f"✅ Found {len(suppliers)} suppliers")
        return suppliers
    
    async def compare_suppliers(self, requirements: Dict, suppliers: List[Dict]) -> Dict:
        """Compare and select best supplier"""
        print("\n⚖️  Step 3: Comparing suppliers...")
        
        suppliers_summary = []
        for idx, supplier in enumerate(suppliers[:5], 1):
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
{json.dumps(requirements, indent=2)}

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
            content = self._clean_json_response(response.content)
            selection = json.loads(content)
            selected_id = selection['selected_id'] - 1
            
            selected_supplier = suppliers[selected_id].copy()
            selected_supplier['selection_reason'] = selection['selection_reason']
            selected_supplier['confidence_score'] = selection['confidence_score']
            
            print(f"✅ Selected supplier: {selected_supplier.get('title', 'N/A')[:60]}...")
            return selected_supplier
            
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            print(f"⚠️  Selection error: {e}")
            selected = min(suppliers, key=lambda x: x.get('price', float('inf')))
            selected['selection_reason'] = "Selected based on lowest price (fallback)"
            print("⚠️  Using fallback selection")
            return selected
    
    async def analyze_market(self, suppliers: List[Dict]) -> Dict:
        """Analyze market prices"""
        print("\n📊 Step 4: Analyzing market...")
        
        prices = [s.get('price', 0) for s in suppliers if s.get('price', 0) > 0]
        
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
                "average_price": 0,
                "min_price": 0,
                "max_price": 0,
                "median_price": 0,
                "total_suppliers": 0,
                "position": "unknown"
            }
        
        print(f"✅ Market average: ₹{market_analysis['average_price']:.2f}")
        return market_analysis
    
    async def calculate_dynamic_price(self, selected_supplier: Dict, market_analysis: Dict) -> tuple:
        """Calculate optimal selling price"""
        print("\n💰 Step 5: Calculating dynamic price...")
        
        purchase_price = selected_supplier.get('price', 0)
        market_avg = market_analysis['average_price']
        
        prompt = f"""You are a pricing strategist AI. Calculate the optimal selling price for this product.

Purchase Price: ₹{purchase_price}
Market Average: ₹{market_avg:.2f}
Market Range: ₹{market_analysis['min_price']} - ₹{market_analysis['max_price']}

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
            content = self._clean_json_response(response.content)
            pricing = json.loads(content)
            optimal_price = float(pricing['optimal_price'])
            profit_margin = float(pricing['profit_margin'])
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"⚠️  Pricing error: {e}")
            optimal_price = purchase_price * 1.20
            profit_margin = 20.0
            print("⚠️  Using fallback pricing (20% markup)")
        
        print(f"✅ Optimal price: ₹{optimal_price:.2f} ({profit_margin:.1f}% margin)")
        return optimal_price, profit_margin
    
    async def run(self, user_query: str) -> Dict:
        """Execute the procurement workflow"""
        
        # Step 1: Analyze user needs
        requirements = await self.analyze_user_needs(user_query)
        
        # Step 2: Fetch suppliers
        suppliers = await self.fetch_suppliers(requirements)
        
        # Step 3: Compare and select supplier
        selected_supplier = await self.compare_suppliers(requirements, suppliers)
        
        # Step 4: Analyze market
        market_analysis = await self.analyze_market(suppliers)
        
        # Step 5: Calculate dynamic price
        optimal_price, profit_margin = await self.calculate_dynamic_price(
            selected_supplier, market_analysis
        )
        
        # Step 6: Generate decision
        print("\n✅ Step 6: Making final decision...")
        
        purchase_price = selected_supplier.get('price', 0)
        profit = optimal_price - purchase_price
        
        decision = f"""
PROCUREMENT RECOMMENDATION
{'=' * 50}

SELECTED SUPPLIER:
  Product: {selected_supplier.get('title', 'N/A')[:80]}
  Purchase Price: ₹{purchase_price:,.2f}
  Rating: {selected_supplier.get('rating', 0)}⭐ ({selected_supplier.get('reviews_count', 0)} reviews)
  Delivery: {selected_supplier.get('shipping_information', 'N/A')}
  Reason: {selected_supplier.get('selection_reason', 'Best overall value')}

PRICING STRATEGY:
  Recommended Selling Price: ₹{optimal_price:,.2f}
  Expected Profit: ₹{profit:,.2f}
  Profit Margin: {profit_margin:.2f}%
  
MARKET POSITION:
  Market Average: ₹{market_analysis['average_price']:,.2f}
  Our Price vs Market: {((optimal_price / market_analysis['average_price'] - 1) * 100):+.1f}%
  Competitiveness: {"✅ Competitive" if optimal_price <= market_analysis['average_price'] else "⚠️  Premium"}

RECOMMENDATION: {"✅ PROCEED" if profit_margin >= 15 else "⚠️  REVIEW NEEDED"}
"""
        
        return {
            'user_query': user_query,
            'user_requirements': requirements,
            'suppliers_data': suppliers,
            'selected_supplier': selected_supplier,
            'market_analysis': market_analysis,
            'optimal_price': optimal_price,
            'profit_margin': profit_margin,
            'decision': decision
        }