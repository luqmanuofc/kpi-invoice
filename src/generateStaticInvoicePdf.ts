import jsPDF from "jspdf";

export function generateStaticInvoicePdf() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // -------------------------------------------------
  // Layout & Style Constants
  // -------------------------------------------------
  const BORDER_COLOR = "#31395e";

  // Page spacing
  const PAGE_PADDING = 15;
  const CONTENT_LEFT_X = PAGE_PADDING + 10;
  const CONTENT_RIGHT_PADDING = 10;

  // Font sizes
  const FONT_SIZE_TITLE = 22;
  const FONT_SIZE_NORMAL = 11;
  const FONT_SIZE_TAX_LABEL = 14;

  // Tax label layout
  const TAX_LABEL_Y_OFFSET = 5;
  const TAX_BG_PAD_X = 4;
  const TAX_BG_PAD_Y = 2;

  // Company title layout
  const COMPANY_TITLE_Y_OFFSET = 30;
  const COMPANY_TITLE_UNDERLINE_OFFSET = 6;

  // Address layout
  const ADDRESS_Y_OFFSET = 16;
  const ADDRESS_UNDERLINE_OFFSET = 4;

  // Right-side contact layout
  const RIGHT_COLUMN_LINE_HEIGHT = 14;
  const RIGHT_COLUMN_VERTICAL_OFFSET = -10; // relative to company title Y

  // Divider spacing
  const HEADER_DIVIDER_Y_OFFSET = 10;

  // Thicknesses
  const BORDER_THICKNESS = 2;
  const UNDERLINE_THICKNESS = 1.5;
  const DIVIDER_THICKNESS = 1.2;
  const SECTION_DIVIDER_THICKNESS = 1;

  // Invoice section spacing
  const INVOICE_SECTION_Y_OFFSET = 15;
  const INVOICE_SECTION_LINE_OFFSET = 7.5;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const CONTENT_RIGHT_X = pageWidth - PAGE_PADDING - CONTENT_RIGHT_PADDING;

  // -------------------------------------------------
  // Utilities
  // -------------------------------------------------

  const centerX = (text: string) => pageWidth / 2 - doc.getTextWidth(text) / 2;

  const rightAlignX = (text: string) =>
    CONTENT_RIGHT_X - doc.getTextWidth(text);

  const drawUnderline = (
    x: number,
    y: number,
    width: number,
    thickness = UNDERLINE_THICKNESS
  ) => {
    doc.setLineWidth(thickness);
    doc.line(x, y, x + width, y);
  };

  // -------------------------------------------------
  // Base Style Setup
  // -------------------------------------------------
  doc.setTextColor(BORDER_COLOR);
  doc.setDrawColor(BORDER_COLOR);

  // -------------------------------------------------
  // Outer Border
  // -------------------------------------------------
  doc.setLineWidth(BORDER_THICKNESS);
  doc.rect(
    PAGE_PADDING,
    PAGE_PADDING,
    pageWidth - PAGE_PADDING * 2,
    pageHeight - PAGE_PADDING * 2
  );

  // -------------------------------------------------
  // "Tax Invoice" Label (Centered on Top Border)
  // -------------------------------------------------
  const TAX_LABEL = "Tax Invoice";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZE_TAX_LABEL);

  const taxLabelX = centerX(TAX_LABEL);
  const taxLabelY = PAGE_PADDING + TAX_LABEL_Y_OFFSET;

  // White box behind text
  doc.setFillColor(255, 255, 255);
  doc.rect(
    taxLabelX - TAX_BG_PAD_X,
    taxLabelY - (FONT_SIZE_TAX_LABEL - TAX_BG_PAD_Y - 4),
    doc.getTextWidth(TAX_LABEL) + TAX_BG_PAD_X * 2,
    FONT_SIZE_TAX_LABEL + TAX_BG_PAD_Y * 2,
    "F"
  );

  doc.text(TAX_LABEL, taxLabelX, taxLabelY);

  // -------------------------------------------------
  // Company Title
  // -------------------------------------------------
  const COMPANY_TITLE = "Khaldun Plastic Industries";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZE_TITLE);

  const companyTitleY = PAGE_PADDING + COMPANY_TITLE_Y_OFFSET;
  doc.text(COMPANY_TITLE, CONTENT_LEFT_X, companyTitleY);

  // Underline
  const companyTitleWidth = doc.getTextWidth(COMPANY_TITLE);
  const companyTitleUnderlineY = companyTitleY + COMPANY_TITLE_UNDERLINE_OFFSET;

  drawUnderline(
    CONTENT_LEFT_X,
    companyTitleUnderlineY,
    companyTitleWidth,
    BORDER_THICKNESS
  );

  // -------------------------------------------------
  // Address + Underline
  // -------------------------------------------------
  const ADDRESS_LINE = "28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR (J&K)";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZE_NORMAL);

  const addressY = companyTitleUnderlineY + ADDRESS_Y_OFFSET;

  doc.text(ADDRESS_LINE, CONTENT_LEFT_X, addressY);

  drawUnderline(
    CONTENT_LEFT_X,
    addressY + ADDRESS_UNDERLINE_OFFSET,
    doc.getTextWidth(ADDRESS_LINE)
  );

  const addressUnderlineY = addressY + ADDRESS_UNDERLINE_OFFSET;

  // -------------------------------------------------
  // Right Column Contact Info
  // -------------------------------------------------
  const contactStartY = companyTitleY + RIGHT_COLUMN_VERTICAL_OFFSET;

  const CONTACT_LINES = [
    "Email: kpikashmir@gmail.com",
    "Mobile: 9419009217",
    "GSTIN: 01BSGPB0427H1ZJ",
  ];

  CONTACT_LINES.forEach((line, i) => {
    const y = contactStartY + RIGHT_COLUMN_LINE_HEIGHT * i;
    doc.text(line, rightAlignX(line), y);
  });

  // -------------------------------------------------
  // Divider under header section
  // -------------------------------------------------
  const dividerY = addressUnderlineY + HEADER_DIVIDER_Y_OFFSET;

  doc.setLineWidth(DIVIDER_THICKNESS);
  doc.line(PAGE_PADDING, dividerY, pageWidth - PAGE_PADDING, dividerY);

  // -------------------------------------------------
  // INVOICE SECTION (Left, Center, Right)
  // -------------------------------------------------
  const invoiceSectionY = dividerY + INVOICE_SECTION_Y_OFFSET;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZE_NORMAL);

  const invoiceNoText = "Invoice No: INV-001";
  const transportText = "Transport No: TR-1234";
  const dateText = "Date: 27/09/2025";

  // Left
  doc.text(invoiceNoText, CONTENT_LEFT_X, invoiceSectionY);

  // Center (true center)
  doc.text(transportText, centerX(transportText), invoiceSectionY);

  // Right
  doc.text(dateText, rightAlignX(dateText), invoiceSectionY);

  // Section divider under invoice section
  doc.setLineWidth(SECTION_DIVIDER_THICKNESS);
  doc.line(
    PAGE_PADDING,
    invoiceSectionY + INVOICE_SECTION_LINE_OFFSET,
    pageWidth - PAGE_PADDING,
    invoiceSectionY + INVOICE_SECTION_LINE_OFFSET
  );

  return doc;
}
