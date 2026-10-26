import fitz


def extract_text_from_pdf(file_path: str) -> str:

    extracted_text = ""

    # Open the PDF document
    pdf_document = fitz.open(file_path)

    # Read each page
    for page in pdf_document:

        # Extract text from the page
        page_text = page.get_text()

        # Add extracted text
        extracted_text += page_text + "\n"

    # Close the PDF
    pdf_document.close()

    return extracted_text.strip()