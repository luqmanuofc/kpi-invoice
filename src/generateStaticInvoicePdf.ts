import jsPDF from "jspdf";

export function generateStaticInvoicePdf() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // -------------------------------------------------
  // Layout & Style Constants
  // -------------------------------------------------
  const BORDER_COLOR = "#31395e";
  const PAGE_PADDING = 15;
  const INNER_LEFT_X = PAGE_PADDING + 10;
  const RIGHT_COLUMN_PADDING = 10;

  const TITLE_FONT_SIZE = 22;
  const NORMAL_FONT_SIZE = 11;
  const TAX_LABEL_FONT_SIZE = 14;

  const TAX_LABEL_VERTICAL_OFFSET = 5;
  const TAX_LABEL_BG_HORIZONTAL_PADDING = 4;
  const TAX_LABEL_BG_VERTICAL_PADDING = 2;

  const TITLE_VERTICAL_OFFSET = 30;
  const TITLE_UNDERLINE_OFFSET = 6;

  const ADDRESS_VERTICAL_OFFSET = 16;
  const ADDRESS_UNDERLINE_OFFSET = 4;

  const RIGHT_COLUMN_LINE_HEIGHT = 14;
  const RIGHT_COLUMN_VERTICAL_OFFSET = -10; // relative to title baseline

  const HEADER_DIVIDER_OFFSET = 10;

  const BORDER_THICKNESS = 2;
  const UNDERLINE_THICKNESS = 1.5;
  const DIVIDER_THICKNESS = 1.2;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const INNER_RIGHT_X = pageWidth - PAGE_PADDING - RIGHT_COLUMN_PADDING;

  // -------------------------------------------------
  // Utility: Right-align any text block
  // -------------------------------------------------
  const rightAlignText = (text: string, y: number) => {
    const width = doc.getTextWidth(text);
    doc.text(text, INNER_RIGHT_X - width, y);
  };

  // -------------------------------------------------
  // Base Styles
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
  // "Tax Invoice" centered on top border
  // -------------------------------------------------
  const TAX_LABEL = "Tax Invoice";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(TAX_LABEL_FONT_SIZE);

  const taxLabelWidth = doc.getTextWidth(TAX_LABEL);
  const taxLabelX = pageWidth / 2 - taxLabelWidth / 2;
  const taxLabelY = PAGE_PADDING + TAX_LABEL_VERTICAL_OFFSET;

  // Background box behind text
  doc.setFillColor(255, 255, 255);
  doc.rect(
    taxLabelX - TAX_LABEL_BG_HORIZONTAL_PADDING,
    taxLabelY - (TAX_LABEL_FONT_SIZE + TAX_LABEL_BG_VERTICAL_PADDING - 4),
    taxLabelWidth + TAX_LABEL_BG_HORIZONTAL_PADDING * 2,
    TAX_LABEL_FONT_SIZE + TAX_LABEL_BG_VERTICAL_PADDING * 2,
    "F"
  );

  doc.text(TAX_LABEL, taxLabelX, taxLabelY);

  // -------------------------------------------------
  // Company Title
  // -------------------------------------------------
  const COMPANY_TITLE = "Khaldun Plastic Industries";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(TITLE_FONT_SIZE);

  const titleY = PAGE_PADDING + TITLE_VERTICAL_OFFSET;
  doc.text(COMPANY_TITLE, INNER_LEFT_X, titleY);

  // Underline under title
  const titleWidth = doc.getTextWidth(COMPANY_TITLE);
  const titleUnderlineY = titleY + TITLE_UNDERLINE_OFFSET;

  doc.setLineWidth(BORDER_THICKNESS);
  doc.line(INNER_LEFT_X, titleUnderlineY, INNER_LEFT_X + titleWidth, titleUnderlineY);

  // -------------------------------------------------
  // Address Line + Underline
  // -------------------------------------------------
  const ADDRESS_LINE = "28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR (J&K)";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(NORMAL_FONT_SIZE);

  const addressY = titleUnderlineY + ADDRESS_VERTICAL_OFFSET;
  doc.text(ADDRESS_LINE, INNER_LEFT_X, addressY);

  const addressWidth = doc.getTextWidth(ADDRESS_LINE);
  const addressUnderlineY = addressY + ADDRESS_UNDERLINE_OFFSET;

  doc.setLineWidth(UNDERLINE_THICKNESS);
  doc.line(INNER_LEFT_X, addressUnderlineY, INNER_LEFT_X + addressWidth, addressUnderlineY);

  // -------------------------------------------------
  // Right-side Contact & GSTIN (Even Spacing)
  // -------------------------------------------------
  const rightColumnBaseY = titleY + RIGHT_COLUMN_VERTICAL_OFFSET;

  rightAlignText("Email: kpikashmir@gmail.com", rightColumnBaseY);
  rightAlignText("Mobile: 9419009217", rightColumnBaseY + RIGHT_COLUMN_LINE_HEIGHT);
  rightAlignText("GSTIN: 01BSGPB0427H1ZJ", rightColumnBaseY + RIGHT_COLUMN_LINE_HEIGHT * 2);

  // -------------------------------------------------
  // Divider Line Under Header
  // -------------------------------------------------
  const dividerY = addressUnderlineY + HEADER_DIVIDER_OFFSET;

  doc.setLineWidth(DIVIDER_THICKNESS);
  doc.line(PAGE_PADDING, dividerY, pageWidth - PAGE_PADDING, dividerY);

  return doc;
}
