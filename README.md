# **Hugo AI**

### *Running Industrial Operations on AI*

Hugo AI is an agent-based intelligent system designed to support **industrial operations, inventory management, and procurement decision-making** using a combination of **deterministic analytics** and **AI-driven reasoning**.
The system follows a clean, modular architecture that separates data ingestion, business logic, and AI reasoning, making it scalable and easy to extend.

---

## **System Overview**

Hugo AI is built around three core ideas:

* **Agent-based reasoning** for analysis, monitoring, and optimization
* **Service-driven business logic** as a single source of truth
* **Clear orchestration via a backend API**

The backend coordinates all components, while agents specialize in specific operational tasks such as answering questions, raising alerts, and suggesting optimizations.

---

## **Core Agents**

* **Analytical Agent**
  Answers operational and analytical questions such as inventory status, build capacity, bottlenecks, and risks by combining structured data with LLM-based reasoning.

* **Reactive Agent**
  Continuously monitors inventory levels, orders, supplier emails, and production capacity to generate real-time alerts.

* **Optimization Agent**
  Analyzes inventory movement patterns and suggests optimized reorder parameters and cost-saving opportunities.

Agents do **not communicate directly with each other**. Instead, they rely on shared services to ensure consistent and reliable outputs.

---

## **Project Folder Architecture**

The project follows a layered and modular structure:

```
amulate/
├── agents/
│   ├── analytical_agent.py     # AI reasoning for operational questions
│   ├── reactive_agent.py       # Alert generation and monitoring
│   └── optimization_agent.py   # Inventory and cost optimization
│
├── services/
│   ├── bom_service.py          # Bill of Materials & build capacity logic
│   └── inventory_service.py    # Inventory health, forecasting, reordering
│
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   └── api/
│       └── chat.py             # API routes for agents and services
│
├── data/
│   └── processors/
│       ├── csv_processor.py    # CSV data ingestion
│       ├── email_processor.py  # Supplier email parsing
│       └── pdf_processor.py    # PDF & OCR-based BOM extraction
│
├── hugo_data_samples/          # Sample CSVs, emails, and PDF documents
│
├── frontend/
│   ├── src/                    # React frontend source code
│   ├── package.json            # Frontend dependencies
│   └── node_modules/
│
├── .env                        # Environment variables
├── requirements.txt            # Python dependencies
├── README.md
└── .gitignore
```

---

## **PDF & OCR Support**

Hugo AI supports **scanned PDF documents** (e.g., technical specifications and BOMs) using OCR.

### Tools Used

* **Tesseract OCR** – Extracts text from scanned PDFs
* **Poppler** – Converts PDFs into images for OCR processing

These tools are required only if scanned PDFs are used.

---

## **Tesseract & Poppler Setup (Windows)**

### 1. Install Tesseract OCR

Download from:
[https://github.com/UB-Mannheim/tesseract/wiki](https://github.com/UB-Mannheim/tesseract/wiki)

Default installation path:

```
C:\Program Files\Tesseract-OCR\
```

Ensure `tesseract.exe` exists in this directory.

---

### 2. Install Poppler

Download Poppler for Windows and extract it.

Recommended path:

```
C:\Program Files\poppler\
```

Ensure the following directory exists:

```
C:\Program Files\poppler\Library\bin
```

---

### 3. Add to System PATH (Required)

Add the following paths to your system `PATH` environment variable:

```
C:\Program Files\Tesseract-OCR\
C:\Program Files\poppler\Library\bin
```

Restart the terminal after updating the PATH.

---

## **Environment Configuration**

Create a `.env` file in the project root:

```env
GOOGLE_API_KEY=your_google_api_key_here
DATA_DIR=./hugo_data_samples
```

* `GOOGLE_API_KEY` is required for LLM-powered agents
* `DATA_DIR` points to the sample operational data

---

## **Run Locally**

### Clone the Repository

```bash
git clone https://github.com/Saadat-Ahmad/amulate
cd amulate
```

---

### Backend Setup

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the backend server:

```bash
python -m backend.main
```

Backend will run at:

```
http://localhost:8000
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

Start development server:

```bash
npm run dev
```

Build and start production server:

```bash
npm run build
npm start
```

---

## **Design Principles**

* Clear separation of concerns
* Deterministic logic before AI reasoning
* Services as a single source of truth
* Pluggable and extensible agent design
* Clean backend orchestration

---

## **System Architecture**
![alt text](https://github.com/Saadat-Ahmad/amulate/blob/main/public/architecture.png?raw=true)

## **Authors**
* **Saadat Ahmad**
  [https://github.com/Saadat-Ahmad](https://github.com/Saadat-Ahmad)

* **Mohammad Faraz Rajput**
  [https://github.com/mohammadfarazrajput](https://github.com/mohammadfarazrajput)

