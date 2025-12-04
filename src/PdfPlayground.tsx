import { useState } from "react";
import { generateStaticInvoicePdf } from "./generateStaticInvoicePdf";

export default function PdfPlayground() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const generatePreview = () => {
    const doc = generateStaticInvoicePdf();

    // Create a blob URL instead of downloading
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    setPdfUrl(url);
  };

  return (
    <div>
      <div>
        <button onClick={generatePreview}>Preview PDF</button>
      </div>

      {pdfUrl && (
        <iframe
          src={pdfUrl}
          style={{ width: "1000px", height: "600px", marginTop: "20px" }}
        />
      )}
    </div>
  );
}
