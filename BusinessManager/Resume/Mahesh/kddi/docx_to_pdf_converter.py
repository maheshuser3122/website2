#!/usr/bin/env python3
import os
import sys
from docx2pdf import convert

def convert_docx_to_pdf():
    docx_path = r"D:\simetric\kddi\WinSCP_SFTP_Connection_Guide.docx"
    pdf_path = r"D:\simetric\kddi\WinSCP_SFTP_Connection_Guide_from_docx.pdf"
    
    try:
        if not os.path.exists(docx_path):
            print(f"❌ Error: File not found at {docx_path}")
            sys.exit(1)
        
        print(f"🔄 Converting {os.path.basename(docx_path)} to PDF...")
        convert(docx_path, pdf_path)
        
        if os.path.exists(pdf_path):
            file_size = os.path.getsize(pdf_path) / (1024 * 1024)
            print(f"✅ PDF created successfully!")
            print(f"📁 Location: {pdf_path}")
            print(f"📊 Size: {file_size:.2f} MB")
        else:
            print("❌ Error: PDF file was not created")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error during conversion: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    convert_docx_to_pdf()
