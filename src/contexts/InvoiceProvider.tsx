import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import dayjs from "dayjs";
import { ToWords } from "to-words";
import type { InvoiceForm } from "../invoice-form/types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { InvoiceDocumentHandle } from "../invoice-document/InvoiceDocument";
import { createInvoice } from "../api/invoices";

type InvoiceContextType = {
  invoiceRef: React.RefObject<InvoiceDocumentHandle | null>;
  form: UseFormReturn<InvoiceForm, any, InvoiceForm>;
  computedData: InvoiceForm;
  handleGeneratePDF: () => void;
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: ReactNode }) {
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

    try {
      const result = await createInvoice(computedData);
      console.log("Invoice created:", result);
    } catch (err) {
      console.error(err);
      alert("Failed to create invoice.");
    }

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
    <InvoiceContext.Provider
      value={{ form, computedData, invoiceRef, handleGeneratePDF }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error("useInvoice must be used within an InvoiceProvider");
  }
  return context;
}
