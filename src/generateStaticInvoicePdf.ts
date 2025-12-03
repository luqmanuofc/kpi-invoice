import jsPDF from "jspdf";

export function generateStaticInvoicePdf() {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const padding = 15;
  const borderColor = "#31395e";

  // --------------------
  // Border
  // --------------------
  doc.setDrawColor(borderColor);
  doc.setLineWidth(2);

  doc.rect(
    padding,
    padding,
    pageWidth - padding * 2,
    pageHeight - padding * 2
  );

  // --------------------
  // Centered "Tax Invoice" Text on Border
  // --------------------
  const text = "Tax Invoice";
  const borderTopY = padding; // top border y-position

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(borderColor);

  const textWidth = doc.getTextWidth(text);
  const textX = pageWidth / 2 - textWidth / 2;
  const textY = borderTopY + 5; // center text vertically on the 2px border line

  // White background box behind text (padding inside)
  const bgPaddingX = 4;
  const bgPaddingY = 2;
  const bgWidth = textWidth + bgPaddingX * 2;
  const bgHeight = 14 + bgPaddingY * 2;

  const bgX = textX - bgPaddingX;
  const bgY = textY - 12; // 12 is approx text height

  doc.setFillColor(255, 255, 255);
  doc.rect(bgX, bgY, bgWidth, bgHeight, "F");

  // Draw the text after the background fill
  doc.text(text, textX, textY);

  return doc;
}
