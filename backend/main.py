# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging

# Import processors
from data.processors import CSVProcessor, EmailProcessor, PDFProcessor

# Import services
from services import BOMService, InventoryService

# Import agents
from agents import AnalyticalAgent, ReactiveAgent, OptimizationAgent

# Import API routes
from backend.api import chat

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Hugo - AI Procurement Agent",
    description="Intelligent procurement assistant for Voltway Electric Scooters",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for agents and services
analytical_agent = None
reactive_agent = None
optimization_agent = None
bom_service = None
inventory_service = None
csv_processor = None
email_processor = None
pdf_processor = None

@app.on_event("startup")
async def startup_event():
    """Initialize Hugo on startup"""
    global analytical_agent, reactive_agent, optimization_agent
    global bom_service, inventory_service
    global csv_processor, email_processor, pdf_processor
    
    logger.info("🚀 Starting Hugo - AI Procurement Agent...")
    
    # Get configuration
    google_api_key = os.getenv("GOOGLE_API_KEY")
    data_dir = os.getenv("DATA_DIR", "./hugo_data_samples")
    
    if not google_api_key:
        logger.error("❌ GOOGLE_API_KEY not found in environment variables")
        raise ValueError("GOOGLE_API_KEY is required")
    
    logger.info(f"📂 Loading data from: {data_dir}")
    
    # Initialize processors
    csv_processor = CSVProcessor(data_dir)
    email_processor = EmailProcessor(f"{data_dir}/emails")
    pdf_processor = PDFProcessor(f"{data_dir}/specs")
    
    # Load all data
    csv_processor.load_all_data()
    emails = email_processor.parse_all_emails()
    specs = pdf_processor.parse_all_specs()
    
    logger.info(f"  ✅ Loaded {len(emails)} emails")
    logger.info(f"  ✅ Loaded {len(specs)} scooter specifications")
    
    # Initialize services
    bom_service = BOMService(csv_processor, pdf_processor)
    inventory_service = InventoryService(csv_processor)
    
    bom_service.load_specs()
    
    # Check if BOMs are empty and warn
    total_parts = sum(len(spec['bom']) for spec in specs.values())
    if total_parts == 0:
        logger.warning("⚠️  WARNING: No BOM parts found in PDFs! Build capacity calculations will return 0.")
        logger.warning("   Check if PDFs are readable and contain the expected format.")
    
    # Initialize agents with correct parameters
    analytical_agent = AnalyticalAgent(
        api_key=google_api_key,
        csv_processor=csv_processor,
        bom_service=bom_service,
        inventory_service=inventory_service
    )
    
    reactive_agent = ReactiveAgent(
        csv_processor=csv_processor,
        email_processor=email_processor,
        bom_service=bom_service,
        inventory_service=inventory_service
    )
    
    optimization_agent = OptimizationAgent(
        api_key=google_api_key,
        csv_processor=csv_processor,
        inventory_service=inventory_service
    )
    
    # Set agents in the chat router
    chat.set_agents(
        analytical_agent,
        reactive_agent,
        optimization_agent,
        bom_service,
        inventory_service,
        csv_processor,
        email_processor
    )
    
    logger.info("✅ Hugo is ready!")
    logger.info("🌐 API available at http://localhost:8000")
    logger.info("📚 Documentation at http://localhost:8000/docs")

# Include routers
app.include_router(chat.router, prefix="/api", tags=["Hugo"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Hugo - AI Procurement Agent for Voltway",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/status")
async def status():
    """System status endpoint"""
    
    # Check BOM status
    bom_status = "operational"
    if bom_service:
        specs = bom_service.specs
        total_parts = sum(len(spec['bom']) for spec in specs.values())
        if total_parts == 0:
            bom_status = "warning - no BOMs loaded"
    
    return {
        "status": "operational",
        "agents": {
            "analytical": analytical_agent is not None,
            "reactive": reactive_agent is not None,
            "optimization": optimization_agent is not None
        },
        "services": {
            "bom": bom_service is not None,
            "bom_status": bom_status,
            "inventory": inventory_service is not None
        },
        "processors": {
            "csv": csv_processor is not None,
            "email": email_processor is not None,
            "pdf": pdf_processor is not None
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)