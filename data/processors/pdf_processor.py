import re
import logging
import pytesseract
from pathlib import Path
from typing import Dict, List, Optional
from pdf2image import convert_from_path
import PyPDF2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self, specs_dir: str):
        self.specs_dir = Path(specs_dir)
        
        # --- WINDOWS PATH CONFIGURATION ---
        # 1. Path to your Tesseract EXE
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        # 2. Path to your Poppler BIN folder (Updated with your actual path)
        self.poppler_bin = r'C:\Release-25.12.0-0\poppler-25.12.0\Library\bin'
        # ----------------------------------

    def parse_all_specs(self) -> Dict[str, Dict]:
        logger.info("📄 Starting scooter specification extraction...")
        specs = {}
        if not self.specs_dir.exists():
            logger.warning(f"  ⚠️  Specs directory not found: {self.specs_dir}")
            return specs
        
        pdf_files = list(self.specs_dir.glob('*.pdf'))
        for pdf_file in pdf_files:
            model_name = self._extract_model_from_filename(pdf_file.name)
            spec_data = self.parse_spec(pdf_file, model_name)
            if spec_data:
                specs[model_name] = spec_data
                logger.info(f"  ✅ Parsed {model_name}: {len(spec_data['bom'])} parts")
        return specs

    def parse_spec(self, pdf_path: Path, model_name: str) -> Optional[Dict]:
        try:
            text = ""
            # 1. Try standard extraction
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            # 2. If Scanned, run OCR
            if not text.strip():
                logger.info(f"  🔍 {pdf_path.name} is a scan. Running OCR...")
                text = self._perform_ocr(pdf_path)
            
            if not text.strip():
                return None

            return {
                'model': model_name,
                'bom': self._extract_bom(text),
                'specifications': self._extract_specifications(text, model_name),
                'raw_text': text[:500]
            }
        except Exception as e:
            logger.error(f"  ⚠️  Error parsing {pdf_path.name}: {e}")
            return None

    def _perform_ocr(self, pdf_path: Path) -> str:
        """Corrected OCR method with the poppler_path argument"""
        try:
            # IMPORTANT: We MUST pass the poppler_path here
            images = convert_from_path(
                pdf_path, 
                poppler_path=self.poppler_bin
            )
            
            ocr_text = ""
            for img in images:
                ocr_text += pytesseract.image_to_string(img) + "\n"
            return ocr_text
        except Exception as e:
            logger.error(f"  ❌ OCR failed: {e}")
            return ""

    def _extract_bom(self, text: str) -> List[Dict]:
        bom = []
        seen = set()
        for line in text.split('\n'):
            match = re.search(r'\b(P\d{3,4})\b', line)
            if match:
                part_id = match.group(1)
                if part_id not in seen:
                    numbers = re.findall(r'\b(\d{1,2})\b', line)
                    qty = int(numbers[-1]) if numbers else 1
                    seen.add(part_id)
                    bom.append({'part_id': part_id, 'quantity': qty})
        return bom

    def _extract_specifications(self, text: str, model_name: str) -> Dict:
        specs = {'model': model_name}
        patterns = {
            'overview': r'Overview:\s*(.*)',
            'motor_power': r'(\d+)W\s+Brushless',
            'battery': r'(\d+)V\s+(\d+)Ah',
            'wheel_size': r'(\d+)-inch'
        }
        for key, pat in patterns.items():
            m = re.search(pat, text, re.IGNORECASE)
            if m: specs[key] = m.group(1) if key != 'battery' else f"{m.group(1)}V {m.group(2)}Ah"
        return specs

    def _extract_model_from_filename(self, filename: str) -> str:
        match = re.search(r'(S\d+)[_-](V\d+)', filename, re.IGNORECASE)
        return f"{match.group(1).upper()}_{match.group(2).upper()}" if match else filename.upper()