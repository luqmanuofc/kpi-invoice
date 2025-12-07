// App.tsx
import "./App.css";
import InvoiceFormPage, {
  type InvoiceForm,
} from "./invoice-form/InvoiceFormPage";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "./invoice-document/InvoiceDocument";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { useMemo, useRef } from "react";
import { ToWords } from "to-words";
import { Button } from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function App() {
  const invoiceRef = useRef<InvoiceDocumentHandle | null>(null);

  const form = useForm<InvoiceForm>({
    defaultValues: {
      invoiceNumber: "",
      vehicleNumber: "",
      date: dayjs().format("YYYY-MM-DD"),

      buyerName: "",
      buyerAddress: "",
      buyerGstin: "",

      items: [{ description: "", hsn: "", qty: 1, unit: "Kg", rate: 0 }],

      discount: 0,
      cgst: 9,
      sgst: 9,
      igst: 0,

      subtotal: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0,

      sellerName: "Khaldun Plastic Industries",
      sellerAddress: "28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR (J&K)",
      sellerEmail: "kpikashmir@gmail.com",
      sellerPhone: "9419009217",
      sellerGstin: "01BSGPB0427H1ZJ",

      amountInWords: "",
    },
  });

  const formData = form.watch();

  const computedData = useMemo<InvoiceForm>(() => {
    const subtotal = formData.items.reduce((sum, i) => sum + i.qty * i.rate, 0);

    const cgstAmount = (subtotal * formData.cgst) / 100;
    const sgstAmount = (subtotal * formData.sgst) / 100;
    const igstAmount = (subtotal * formData.igst) / 100;

    const total =
      subtotal - formData.discount + cgstAmount + sgstAmount + igstAmount;

    const toWords = new ToWords({ localeCode: "en-IN" });
    const amountInWords =
      toWords.convert(Math.round(total)).toUpperCase() + " ONLY";

    return {
      ...formData,
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      total,
      amountInWords,
    };
  }, [formData]);

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
        <InvoiceFormPage form={form} />
        <Button variant="contained" onClick={handleGeneratePDF}>
          Generate PDF
        </Button>
      </div>

      <InvoiceDocument ref={invoiceRef} data={computedData} />
    </div>
  );
}

export default App;
