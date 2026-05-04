#!/usr/bin/env python3
import os
import sys
from pathlib import Path

def docx_to_pdf_with_word_com():
    """Convert DOCX to PDF using Microsoft Word COM interface"""
    try:
        import win32com.client
        
        docx_path = r"D:\simetric\kddi\WinSCP_SFTP_Connection_Guide.docx"
        pdf_path = r"D:\simetric\kddi\WinSCP_SFTP_Connection_Guide.pdf"
        
        # Convert absolute path
        docx_abs = os.path.abspath(docx_path)
        pdf_abs = os.path.abspath(pdf_path)
        
        print(f"🔄 Converting DOCX to PDF using Microsoft Word...")
        print(f"   Source: {docx_abs}")
        print(f"   Output: {pdf_abs}")
        
        # Open Word application
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        
        try:
            # Open the document
            doc = word.Documents.Open(docx_abs)
            
            # Export as PDF
            doc.ExportAsFixedFormat(
                pdf_abs,
                2,  # wdExportFormatPDF
                False,  # OpenAfterExport
                1,  # wdExportOptimizeFor - Standard
                0,  # wdExportRange - wdExportAllDocument
                1,  # FromPage
                1,  # ToPage
                0,  # Item
                True,  # IncludeDocProps
                True,  # KeepIRM
                2,  # CreateBookmarks
                True,  # DocStructureTags
                False   # BitmapMissingFonts
            )
            
            doc.Close()
            word.Quit()
            
            if os.path.exists(pdf_abs):
                file_size = os.path.getsize(pdf_abs) / (1024 * 1024)
                print(f"✅ PDF created successfully!")
                print(f"📁 Location: {pdf_abs}")
                print(f"📊 Size: {file_size:.2f} MB")
                return True
            else:
                print("❌ PDF was not created")
                return False
                
        finally:
            try:
                word.Quit()
            except:
                pass
                
    except Exception as e:
        print(f"⚠️  Word COM conversion failed: {str(e)}")
        return False

def main():
    docx_path = r"D:\simetric\kddi\WinSCP_SFTP_Connection_Guide.docx"
    
    if not os.path.exists(docx_path):
        print(f"❌ Error: File not found at {docx_path}")
        sys.exit(1)
    
    print("📄 DOCX to PDF Conversion Tool\n")
    
    # Try Word COM conversion
    if docx_to_pdf_with_word_com():
        print("\n✅ Conversion completed!")
        sys.exit(0)
    else:
        print("\n❌ Conversion failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
