# Sample Documents

This folder contains sample documents for testing and demonstrating DocuExtract Pro.

## Included Samples

### 1. sample-invoice.html
A realistic invoice document with:
- Company header and logo placeholder
- Invoice number, date, due date
- Bill-to and ship-to addresses
- Line items table with quantities and prices
- Subtotal, tax, and total calculations
- Payment terms and notes
- Signature line

**Expected Extractions:**
- Key-Value Pairs: Invoice #, Date, Due Date, Customer Name, Total Amount
- Tables: Line items with descriptions, quantities, unit prices, amounts
- Signatures: Authorized signature detected

### 2. sample-contract.html
A professional services agreement with:
- Party names and addresses
- Contract terms and conditions
- Payment schedule table
- Multiple signature blocks with dates

**Expected Extractions:**
- Key-Value Pairs: Contract Date, Parties, Effective Date, Total Value
- Tables: Payment schedule
- Signatures: Multiple signature blocks detected

## How to Use

### Option 1: Open in Browser and Print to PDF
1. Open the HTML file in any web browser
2. Press Ctrl+P (Windows) or Cmd+P (Mac)
3. Select "Save as PDF"
4. Upload the PDF to DocuExtract Pro

### Option 2: Screenshot
1. Open the HTML file in a browser
2. Take a screenshot (or use browser developer tools to capture full page)
3. Upload the image to DocuExtract Pro

### Option 3: Use the provided PDFs
If PDF versions are included, upload directly to DocuExtract Pro.

## Testing Checklist

Use these samples to verify:

- [ ] File upload works (drag-drop and click)
- [ ] Progress bar advances smoothly
- [ ] Text extraction is accurate
- [ ] Tables are properly structured
- [ ] Key-value pairs are identified correctly
- [ ] Signatures are detected with confidence scores
- [ ] Export to JSON works
- [ ] Export to CSV works
- [ ] Export to Excel works
- [ ] Export to Markdown works

## Creating Your Own Test Documents

For best results, test with documents that have:

1. **Clear text** - Good contrast, readable fonts
2. **Tables** - Various sizes, with and without borders
3. **Key-value pairs** - Labels followed by values (e.g., "Invoice #: 12345")
4. **Signatures** - Handwritten signatures or signature images

## Notes

- These are sample documents for testing purposes only
- All data (names, addresses, amounts) is fictional
- Documents are designed to showcase extraction capabilities
