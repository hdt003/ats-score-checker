import fitz  # PyMuPDF
import io
import re

class PDFParser:
    @staticmethod
    def parse_pdf(file_bytes: bytes) -> dict:
        """
        Parses PDF file bytes to extract text, page count, layout structures, and formatting indicators.
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page_count = len(doc)
            full_text = []
            has_images = False
            has_tables = False
            has_multi_column = False
            has_header_footer_text = False
            lines_with_formatting = []
            
            for page_idx, page in enumerate(doc):
                # Check for images
                image_list = page.get_images()
                if image_list:
                    has_images = True
                
                # Check for tables using fitz find_tables if available
                try:
                    tables = page.find_tables()
                    if len(tables.tables) > 0:
                        has_tables = True
                except Exception:
                    pass
                
                # Page text with layout blocks
                text_blocks = page.get_text("blocks")
                page_lines = []
                
                # Simple multi-column detection heuristic: check X coordinates of text blocks
                x_coords = [b[0] for b in text_blocks if len(b) >= 5 and b[4].strip()]
                if len(x_coords) > 4:
                    # If text blocks alternate widely horizontally on the same page
                    left_blocks = [x for x in x_coords if x < 200]
                    right_blocks = [x for x in x_coords if x >= 300]
                    if len(left_blocks) >= 2 and len(right_blocks) >= 2:
                        has_multi_column = True

                for b in text_blocks:
                    if len(b) >= 5:
                        block_text = b[4].strip()
                        if block_text:
                            # Header/footer heuristic (near top y < 50 or bottom y > page height - 50)
                            y0 = b[1]
                            y1 = b[3]
                            page_height = page.rect.height
                            if (y0 < 40 or y1 > page_height - 40) and len(block_text.split()) < 15:
                                has_header_footer_text = True
                            page_lines.append(block_text)
                
                full_text.append("\n".join(page_lines))
            
            raw_text = "\n\n".join(full_text)
            
            # Text extraction quality calculation
            char_count = len(raw_text.strip())
            word_count = len(raw_text.split())
            
            # Check for invisible or unreadable text (high ratio of non-printable or corrupt characters)
            corrupt_chars = len(re.findall(r'[^\x00-\x7F\u00A0-\u024F\u0400-\u04FF]', raw_text))
            parsing_confidence = 1.0
            if char_count < 100:
                parsing_confidence = 0.3
            elif corrupt_chars / max(1, char_count) > 0.05:
                parsing_confidence = 0.6
                
            return {
                "raw_text": raw_text,
                "page_count": page_count,
                "word_count": word_count,
                "has_images": has_images,
                "has_tables": has_tables,
                "has_multi_column": has_multi_column,
                "has_header_footer_text": has_header_footer_text,
                "parser_confidence": parsing_confidence,
                "success": True,
                "error": None
            }
        except Exception as e:
            return {
                "raw_text": "",
                "page_count": 0,
                "word_count": 0,
                "has_images": False,
                "has_tables": False,
                "has_multi_column": False,
                "has_header_footer_text": False,
                "parser_confidence": 0.0,
                "success": False,
                "error": str(e)
            }
