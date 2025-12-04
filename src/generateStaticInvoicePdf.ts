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
  // "Tax Invoice" centered on top border
  // --------------------
  const text = "Tax Invoice";
  const borderTopY = padding;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(borderColor);

  const textWidth = doc.getTextWidth(text);
  const textX = pageWidth / 2 - textWidth / 2;
  const textY = borderTopY + 5;

  const bgPaddingX = 4;
  const bgPaddingY = 2;
  const bgWidth = textWidth + bgPaddingX * 2;
  const bgHeight = 14 + bgPaddingY * 2;
  const bgX = textX - bgPaddingX;
  const bgY = textY - 12;

  doc.setFillColor(255, 255, 255);
  doc.rect(bgX, bgY, bgWidth, bgHeight, "F");

  doc.text(text, textX, textY);

  // --------------------
  // "Khaldun Plastic Industries" Title
  // --------------------
  const title = "Khaldun Plastic Industries";
  const titleX = padding + 10;
  const titleY = padding + 30; // vertical anchor for both sides

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(borderColor);

  doc.text(title, titleX, titleY);

  // --- title underline ---
  const titleWidth = doc.getTextWidth(title);
  const underlineY = titleY + 6;

  doc.setDrawColor(borderColor);
  doc.setLineWidth(2);
  doc.line(titleX, underlineY, titleX + titleWidth, underlineY);

  // --------------------
  // Address line
  // --------------------
  const addressText = "28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR (J&K)";
  const addressY = underlineY + 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(borderColor);

  doc.text(addressText, titleX, addressY);

  // --- underline under address ---
  const addressWidth = doc.getTextWidth(addressText);
  const addressUnderlineY = addressY + 4;

  doc.setDrawColor(borderColor);
  doc.setLineWidth(1.5);
  doc.line(titleX, addressUnderlineY, titleX + addressWidth, addressUnderlineY);

  // --------------------
  // NEW: Right-side Email & Mobile (right-aligned)
  // --------------------

  // Right margin inside the border:
  const rightMarginX = pageWidth - padding - 10;

  const emailText = "Email: kpikashmir@gmail.com";
  const mobileText = "Mobile: 9419009217";

  const emailWidth = doc.getTextWidth(emailText);
  const mobileWidth = doc.getTextWidth(mobileText);

  // Top alignment matches the title's vertical position (titleY)
  const rightBlockY = titleY;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(borderColor);

  // Right-aligned text: x = rightMarginX - textWidth
  doc.text(emailText, rightMarginX - emailWidth, rightBlockY);
  doc.text(mobileText, rightMarginX - mobileWidth, rightBlockY + 16);

  return doc;
}
