import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "../invoice-document/InvoiceDocument";
import { getInvoiceById, type Invoice } from "../api/invoices";
import type { Buyer, InvoiceForm } from "../invoice-form/types";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { GridDownloadIcon } from "@mui/x-data-grid";

export default function InvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const invoiceRef = useRef<InvoiceDocumentHandle | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) {
        setError("Invoice ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getInvoiceById(id);
        setInvoice(data);
      } catch (err: any) {
        setError(err.message || "Failed to load invoice");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  // Transform Invoice to InvoiceForm format
  const invoiceData = useMemo<InvoiceForm | null>(() => {
    if (!invoice) return null;

    return {
      invoiceNumber: invoice.invoiceNumber,
      vehicleNumber: invoice.vehicleNumber,
      date: dayjs(invoice.date).format("YYYY-MM-DD"),

      buyer: {
        id: invoice.buyerId,
        name: invoice.buyerNameSnapshot,
        address: invoice.buyerAddressSnapshot,
        gstin: invoice.buyerGstinSnapshot,
        phone: invoice.buyerPhontSnapshot,
      } as Buyer,

      sellerName: invoice.sellerNameSnapshot,
      sellerAddress: invoice.sellerAddressSnapshot,
      sellerEmail: invoice.sellerEmailSnapshot,
      sellerPhone: invoice.sellerPhoneSnapshot,
      sellerGstin: invoice.sellerGstinSnapshot,

      items: invoice.items || [],

      cgstRate: invoice.cgstRate,
      sgstRate: invoice.sgstRate,
      igstRate: invoice.igstRate,

      cgstAmount: Number(invoice.cgstAmount),
      sgstAmount: Number(invoice.sgstAmount),
      igstAmount: Number(invoice.igstAmount),

      discount: Number(invoice.discount),
      subtotal: Number(invoice.subtotal),
      total: Number(invoice.total),
      amountInWords: invoice.amountInWords,
    };
  }, [invoice]);

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;

    const pageElements = invoiceRef.current.getPageElements();
    if (!pageElements.length) return;

    // pageElements are already the .invoice-page divs
    const invoicePages = pageElements;
    // Store original display styles
    const originalStyles = pageElements.map((el) => el.style.display);

    try {
      // Show all pages and remove zoom for PDF generation
      pageElements.forEach((el, idx) => {
        el.style.display = "block";
        invoicePages[idx]?.classList.add("no-zoom");
      });

      // Wait for layout to update
      await new Promise((resolve) => setTimeout(resolve, 100));

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

        const imgData = canvas.toDataURL("image/jpeg", 1);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
        isFirstPage = false;
      }

      const fileName = `Invoice_${
        invoiceData?.invoiceNumber || "draft"
      }_${dayjs().format("YYYYMMDD")}.pdf`;
      pdf.save(fileName);
    } finally {
      // Restore original display styles and remove no-zoom class
      pageElements.forEach((el, idx) => {
        el.style.display = originalStyles[idx];
        invoicePages[idx]?.classList.remove("no-zoom");
      });
    }
  };

  const printPDF = async () => {
    if (!invoiceRef.current) return;

    const pageElements = invoiceRef.current.getPageElements();
    if (!pageElements.length) return;

    const invoicePages = pageElements;
    const originalStyles = pageElements.map((el) => el.style.display);

    try {
      // Show all pages and remove zoom for PDF generation
      pageElements.forEach((el, idx) => {
        el.style.display = "block";
        invoicePages[idx]?.classList.add("no-zoom");
      });

      // Wait for layout to update
      await new Promise((resolve) => setTimeout(resolve, 100));

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

        const imgData = canvas.toDataURL("image/jpeg", 0.85);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
        isFirstPage = false;
      }

      // Create a blob URL and open it for printing
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Open in new window and trigger print
      const printWindow = window.open(blobUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up the blob URL after a delay
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        };
      }
    } finally {
      // Restore original display styles and remove no-zoom class
      pageElements.forEach((el, idx) => {
        el.style.display = originalStyles[idx];
        invoicePages[idx]?.classList.remove("no-zoom");
      });
    }
  };

  const handleBack = () => {
    const returnUrl = searchParams.get("returnUrl") || "/invoices";
    navigate(returnUrl);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoiceData) {
    return (
      <Box sx={{ margin: "2rem" }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Invoice not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back
        </Button>
      </Box>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<GridDownloadIcon />}
            onClick={downloadPDF}
          >
            Download
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={printPDF}
          >
            Print
          </Button>
        </Box>
      </Box>

      <InvoiceDocument
        data={invoiceData}
        transformOrigin="top center"
        ref={invoiceRef}
      />
    </div>
  );
}
