// App.tsx
import "./App.css";
import InvoiceFormPage from "./invoice-form/InvoiceFormPage";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "./invoice-document/InvoiceDocument";
import { useRef } from "react";
import { Button } from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import { useInvoice } from "./contexts/InvoiceProvider";

function App() {
  const invoiceRef = useRef<InvoiceDocumentHandle | null>(null);
  const { form, computedData } = useInvoice();

  const handleGeneratePDF = async () => {
    if (!invoiceRef.current) return;

    const pageElements = invoiceRef.current.getPageElements();
    if (!pageElements.length) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let isFirstPage = true;

    for (const pageEl of pageElements) {
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (!isFirstPage) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      isFirstPage = false;
    }

    const fileName = `Invoice_${
      computedData.invoiceNumber || "draft"
    }_${dayjs().format("YYYYMMDD")}.pdf`;
    pdf.save(fileName);
  };

  return (
    <div
      style={{
        display: "flex",
        padding: "1rem",
        gap: "1rem",
        flexDirection: "row",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: "1rem",
        }}
      >
        <InvoiceFormPage />
        <Button variant="contained" onClick={handleGeneratePDF}>
          Generate PDF
        </Button>
      </div>

      <InvoiceDocument ref={invoiceRef} />
    </div>
  );
}

export default App;
