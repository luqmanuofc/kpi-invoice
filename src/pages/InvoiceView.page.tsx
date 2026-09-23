import { useState, useMemo, useRef } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { Loader2, ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "../invoice-document/InvoiceDocument";
import type { Buyer, InvoiceForm } from "../invoice-form/types";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useInvoice } from "@/hooks/useInvoices";
import { usePrintJob, usePrintInvoiceEpson, isPrintJobInFlight } from "@/hooks/usePrintJob";

// Translates Epson's raw job status into something a non-technical user can
// act on -- "media_empty" means nothing to someone printing an invoice.
function printStatusDisplay(status: string): {
  label: string;
  tone: "pending" | "success" | "error" | "neutral";
} {
  switch (status) {
    case "preparing":
    case "reserved":
    case "pending":
      return { label: "Sending to printer…", tone: "pending" };
    case "processing":
      return { label: "Printing…", tone: "pending" };
    case "completed":
      return { label: "Printed", tone: "success" };
    case "media_empty":
      return { label: "Printer is out of paper", tone: "error" };
    case "media_jam":
      return { label: "Paper jam", tone: "error" };
    case "marker_supply_empty":
      return { label: "Printer is out of ink", tone: "error" };
    case "error_occurred":
    case "stopped_other":
      return { label: "Print failed", tone: "error" };
    case "canceled":
      return { label: "Print canceled", tone: "neutral" };
    case "expired":
      return { label: "Print job expired (never printed)", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

// WhatsApp icon component (since lucide-react doesn't have it)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export default function InvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const invoiceRef = useRef<InvoiceDocumentHandle | null>(null);

  const {
    data: invoice,
    isLoading,
    error: invoiceErrorObj,
  } = useInvoice(id);
  const error = !id
    ? "Invoice ID is required"
    : invoiceErrorObj
      ? invoiceErrorObj instanceof Error
        ? invoiceErrorObj.message
        : "Failed to load invoice"
      : null;

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: printJob } = usePrintJob(id);
  const printMutation = usePrintInvoiceEpson(id);

  // Transform Invoice to InvoiceForm format
  const invoiceData = useMemo<InvoiceForm | null>(() => {
    if (!invoice) return null;
    const total = Number(invoice.total);
    const subtotal = Number(invoice.subtotal);
    const discount = Number(invoice.discount);
    const cgstAmount = Number(invoice.cgstAmount);
    const sgstAmount = Number(invoice.sgstAmount);
    const igstAmount = Number(invoice.igstAmount);

    // discount is already included in subtotal, so we don't subtract it again here
    const computedTotal = subtotal + cgstAmount + sgstAmount + igstAmount;

    const roundOffAmount = total - computedTotal;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      vehicleNumber: invoice.vehicleNumber,
      date: dayjs(invoice.date).format("YYYY-MM-DD"),

      buyer: {
        id: invoice.buyerId,
        name: invoice.buyerNameSnapshot,
        address: invoice.buyerAddressSnapshot,
        gstin: invoice.buyerGstinSnapshot,
        phone: invoice.buyerPhoneSnapshot,
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

      cgstAmount,
      sgstAmount,
      igstAmount,

      discount,
      subtotal,
      total,
      roundOffAmount,
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
      // Show loading modal
      setIsGeneratingPDF(true);

      // Show all pages and remove zoom for PDF generation
      pageElements.forEach((el, idx) => {
        el.style.display = "block";
        invoicePages[idx]?.classList.add("no-zoom", "pdf-export");
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
        // Store references to all stylesheets we'll temporarily disable
        const stylesheets = Array.from(document.styleSheets);
        const disabledSheets: CSSStyleSheet[] = [];

        // Temporarily disable all stylesheets except invoice-specific ones
        stylesheets.forEach((sheet) => {
          try {
            // Check if this is a Tailwind or other non-invoice stylesheet
            const ownerNode = sheet.ownerNode as HTMLElement;
            const href = (ownerNode as HTMLLinkElement)?.href || "";
            const isInvoiceCSS =
              href.includes("InvoiceDocument.css") ||
              sheet.cssRules?.[0]?.cssText?.includes("invoice-page");

            if (!isInvoiceCSS && !sheet.disabled) {
              sheet.disabled = true;
              disabledSheets.push(sheet);
            }
          } catch (e) {
            // CORS or other errors - skip
          }
        });

        // Force a reflow to apply the style changes
        pageEl.offsetHeight;

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          onclone: (clonedDoc) => {
            // Replace oklch CSS variables with rgb equivalents
            const style = clonedDoc.createElement("style");
            style.textContent = `
              :root {
                --background: rgb(255, 255, 255);
                --border: rgb(229, 229, 229);
              }
            `;
            clonedDoc.head.appendChild(style);
          },
        });

        // Re-enable the stylesheets we disabled
        disabledSheets.forEach((sheet) => {
          sheet.disabled = false;
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
        invoicePages[idx]?.classList.remove("no-zoom", "pdf-export");
      });
      // Hide loading modal after a short delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsGeneratingPDF(false);
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

  const printToEpson = async () => {
    if (!id) return;
    const pdf = await generatePDF(0.85); // keep the upload small
    if (!pdf) return;

    const fileName = `Invoice_${
      invoiceData?.invoiceNumber || "draft"
    }_${dayjs().format("YYYYMMDD")}.pdf`;

    // jsPDF's data URI is already base64; strip the "data:...;base64," prefix.
    const dataUri = pdf.output("datauristring");
    const pdfBase64 = dataUri.slice(dataUri.indexOf(",") + 1);

    printMutation.mutate({ invoiceId: id, fileName, pdfBase64 });
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
          }`,
        );
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, "_blank");
        alert(
          "PDF cannot be shared directly. Please use the generic share button or download and share manually.",
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
    // Prefer real browser back navigation so we pop the existing history
    // entry instead of pushing a duplicate one on top of it (which breaks
    // subsequent back navigation further up the chain, e.g. dashboard ->
    // buyer -> invoice -> back -> back). Only fall back to returnUrl when
    // there's no in-app history to go back to (direct link/refresh).
    if (location.key !== "default") {
      navigate(-1);
    } else {
      const returnUrl = searchParams.get("returnUrl") || "/invoices";
      navigate(returnUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full min-h-full justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="p-8 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Invoice not found"}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 w-full h-full">
      {/* Loading Modal */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-50  bg-background rounded-lg p-8 flex flex-col justify-center items-center gap-4 shadow-xl w-full min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">
            Generating PDF...
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {invoice?.status === "archived" ? (
          <p className="text-sm text-muted-foreground">
            Download and other actions are disabled on archived invoices.
          </p>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={downloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={printToEpson}
              disabled={
                printMutation.isPending || isPrintJobInFlight(printJob?.status)
              }
            >
              {printMutation.isPending || isPrintJobInFlight(printJob?.status) ? (
                <Loader2 className={isMobile ? "h-4 w-4 animate-spin" : "mr-2 h-4 w-4 animate-spin"} />
              ) : (
                <Printer className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
              )}
              {!isMobile && "Print to Epson"}
            </Button>
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={shareWhatsApp}
                className="text-[#25D366] border-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
              >
                <WhatsAppIcon />
              </Button>
            )}
          </div>
        )}
      </div>

      {printMutation.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {printMutation.error instanceof Error
              ? printMutation.error.message
              : "Failed to send invoice to printer"}
          </AlertDescription>
        </Alert>
      )}

      {printJob && !printMutation.error && (
        <Alert
          variant={
            printStatusDisplay(printJob.status).tone === "error"
              ? "destructive"
              : "default"
          }
          className="mb-4"
        >
          {printStatusDisplay(printJob.status).tone === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : printStatusDisplay(printJob.status).tone === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <AlertDescription>
            {printStatusDisplay(printJob.status).label}
          </AlertDescription>
        </Alert>
      )}

      <InvoiceDocument
        data={invoiceData}
        transformOrigin="top center"
        ref={invoiceRef}
      />
    </div>
  );
}
