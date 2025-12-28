# agents/supplier_service.py
import httpx
from typing import List, Dict
import json

class SupplierService:
    def __init__(self):
        self.amazon_api_url = "https://api.example.com/amazon"  # Replace with your actual API
        self.timeout = 30.0
    
    async def fetch_suppliers(self, query: str) -> List[Dict]:
        """
        Fetch suppliers from multiple sources
        For now, using mock data based on your example
        """
        print(f"   Searching for: {query}")
        
        # TODO: Replace with actual API calls
        # For now, return mock data similar to your example
        
        mock_suppliers = self._generate_mock_data(query)
        
        # When you have real API:
        # suppliers = await self._fetch_from_amazon(query)
        # suppliers.extend(await self._fetch_from_flipkart(query))
        
        return mock_suppliers
    
    def _generate_mock_data(self, query: str) -> List[Dict]:
        """Generate mock supplier data for testing"""
        return [
            {
                "asin": "B087G6FKMK",
                "title": f"Premium {query} - Pack of 10",
                "price": 5527,
                "price_strikethrough": 10899,
                "rating": 4.5,
                "reviews_count": 1250,
                "is_prime": True,
                "is_sponsored": False,
                "shipping_information": "FREE delivery Tomorrow",
                "url": "/product/B087G6FKMK",
                "url_image": "https://m.media-amazon.com/images/I/41hKa-kzShL._AC_UY218_.jpg",
                "availability_score": 0.9
            },
            {
                "asin": "B088H7GLNP",
                "title": f"Budget {query} - Pack of 5",
                "price": 3299,
                "price_strikethrough": 5999,
                "rating": 4.2,
                "reviews_count": 890,
                "is_prime": False,
                "is_sponsored": False,
                "shipping_information": "FREE delivery in 3 days",
                "url": "/product/B088H7GLNP",
                "url_image": "https://m.media-amazon.com/images/I/sample.jpg",
                "availability_score": 0.7
            },
            {
                "asin": "B089I8JMPQ",
                "title": f"Ultra HD {query} - Premium Quality",
                "price": 6799,
                "price_strikethrough": 12999,
                "rating": 4.7,
                "reviews_count": 2100,
                "is_prime": True,
                "is_sponsored": True,
                "shipping_information": "FREE delivery Today",
                "url": "/product/B089I8JMPQ",
                "url_image": "https://m.media-amazon.com/images/I/sample2.jpg",
                "availability_score": 0.95
            },
            {
                "asin": "B090J9KNRQ",
                "title": f"Basic {query} - Value Pack",
                "price": 2499,
                "price_strikethrough": 4499,
                "rating": 3.9,
                "reviews_count": 450,
                "is_prime": False,
                "is_sponsored": False,
                "shipping_information": "Delivery in 5-7 days",
                "url": "/product/B090J9KNRQ",
                "url_image": "https://m.media-amazon.com/images/I/sample3.jpg",
                "availability_score": 0.6
            },
            {
                "asin": "B091K0LSRS",
                "title": f"Professional {query} - Tempered Glass",
                "price": 4899,
                "price_strikethrough": 8999,
                "rating": 4.6,
                "reviews_count": 1680,
                "is_prime": True,
                "is_sponsored": False,
                "shipping_information": "FREE delivery Tomorrow",
                "url": "/product/B091K0LSRS",
                "url_image": "https://m.media-amazon.com/images/I/sample4.jpg",
                "availability_score": 0.85
            }
        ]
    
    async def _fetch_from_amazon(self, query: str) -> List[Dict]:
        """Fetch from Amazon API - implement when you have the API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    self.amazon_api_url,
                    params={"keywords": query, "country": "IN"}
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Error fetching from Amazon: {e}")
                return []
    
    def calculate_availability_score(self, supplier: Dict) -> float:
        """Calculate availability score (0-1)"""
        score = 0.0
        
        if supplier.get('is_prime'):
            score += 0.3
        if 'FREE delivery' in supplier.get('shipping_information', ''):
            score += 0.2
        if supplier.get('rating', 0) > 4.0:
            score += 0.3
        if supplier.get('reviews_count', 0) > 100:
            score += 0.2
        
        return min(score, 1.0)