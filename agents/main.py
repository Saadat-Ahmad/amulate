# agents/main.py
import asyncio
from procurement_agent_simple import ProcurementAgent  # Changed this line
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_procurement_agent():
    """Test the procurement agent with a sample query"""
    
    agent = ProcurementAgent()
    
    # Test query
    user_query = "I need to buy iPhone 5 screen protectors, around 10 pieces, budget is 6000 INR"
    
    print("=" * 60)
    print("Testing Procurement Agent")
    print("=" * 60)
    print(f"\nUser Query: {user_query}\n")
    
    try:
        result = await agent.run(user_query)
        
        print("\n" + "=" * 60)
        print("RESULTS")
        print("=" * 60)
        
        print("\n1. USER REQUIREMENTS EXTRACTED:")
        print(json.dumps(result.get('user_requirements', {}), indent=2))
        
        print("\n2. SUPPLIERS FOUND:")
        for idx, supplier in enumerate(result.get('suppliers_data', [])[:3], 1):
            print(f"\n   Supplier {idx}:")
            print(f"   - Title: {supplier.get('title', 'N/A')[:80]}...")
            print(f"   - Price: ₹{supplier.get('price', 0)}")
            print(f"   - Rating: {supplier.get('rating', 0)} ({supplier.get('reviews_count', 0)} reviews)")
            print(f"   - Prime: {supplier.get('is_prime', False)}")
        
        print("\n3. SELECTED SUPPLIER:")
        selected = result.get('selected_supplier', {})
        print(f"   - Title: {selected.get('title', 'N/A')[:80]}")
        print(f"   - Price: ₹{selected.get('price', 0)}")
        print(f"   - Reason: {selected.get('selection_reason', 'N/A')}")
        
        print("\n4. MARKET ANALYSIS:")
        market = result.get('market_analysis', {})
        print(f"   - Average Price: ₹{market.get('average_price', 0):.2f}")
        print(f"   - Price Range: ₹{market.get('min_price', 0)} - ₹{market.get('max_price', 0)}")
        
        print("\n5. DYNAMIC PRICING:")
        print(f"   - Purchase Price: ₹{selected.get('price', 0)}")
        print(f"   - Suggested Selling Price: ₹{result.get('optimal_price', 0):.2f}")
        print(f"   - Profit Margin: {result.get('profit_margin', 0):.2f}%")
        
        print("\n6. FINAL DECISION:")
        print(result.get('decision', 'N/A'))
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import json
    asyncio.run(test_procurement_agent())