import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "../invoice-document/InvoiceDocument";
import { getInvoiceById, type Invoice } from "../api/invoices";
import type { Buyer, InvoiceForm } from "../invoice-form/types";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { GridDownloadIcon } from "@mui/x-data-grid";

// Detect if user is on a mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export default function InvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const invoiceRef = useRef<InvoiceDocumentHandle | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

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

  // Shared PDF generation function
  const generatePDF = async (quality: number = 1): Promise<jsPDF | null> => {
    if (!invoiceRef.current) return null;

    const pageElements = invoiceRef.current.getPageElements();
    if (!pageElements.length) return null;

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

        const imgData = canvas.toDataURL("image/jpeg", quality);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
        isFirstPage = false;
      }

      return pdf;
    } finally {
      // Restore original display styles and remove no-zoom class
      pageElements.forEach((el, idx) => {
        el.style.display = originalStyles[idx];
        invoicePages[idx]?.classList.remove("no-zoom");
      });
    }
  };

  const downloadPDF = async () => {
    const pdf = await generatePDF(1); // High quality for download
    if (!pdf) return;

    const fileName = `Invoice_${
      invoiceData?.invoiceNumber || "draft"
    }_${dayjs().format("YYYYMMDD")}.pdf`;
    pdf.save(fileName);
  };

  const printPDF = async () => {
    const pdf = await generatePDF(1); // Slightly lower quality for print
    if (!pdf) return;

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
  };

  const shareWhatsApp = async () => {
    const pdf = await generatePDF(0.85);
    if (!pdf) return;

    try {
      // Generate PDF as blob
      const pdfBlob = pdf.output("blob");
      const fileName = `Invoice_${
        invoiceData?.invoiceNumber || "draft"
      }_${dayjs().format("YYYYMMDD")}.pdf`;

      // Create file object
      const file = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      // For iOS/Mobile: Use Web Share API with WhatsApp hint
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${invoiceData?.invoiceNumber || ""}`,
          text: `Invoice for ${invoiceData?.buyer?.name || ""}`,
          files: [file],
        });
      } else {
        // Fallback: Try to open WhatsApp with a message
        const message = encodeURIComponent(
          `Invoice ${invoiceData?.invoiceNumber || ""} for ${
            invoiceData?.buyer?.name || ""
          }`
        );
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, "_blank");
        alert(
          "PDF cannot be shared directly. Please use the generic share button or download and share manually."
        );
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        alert(`Failed to share: ${error.message || "Unknown error"}`);
      }
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
          {isMobile && (
            <>
              <IconButton
                onClick={shareWhatsApp}
                sx={{
                  color: "#25D366",
                  border: "1px solid #25D366",
                  borderRadius: "4px",
                  "&:hover": {
                    borderColor: "#128C7E",
                    backgroundColor: "rgba(37, 211, 102, 0.04)",
                  },
                }}
              >
                <WhatsAppIcon />
              </IconButton>
            </>
          )}
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
