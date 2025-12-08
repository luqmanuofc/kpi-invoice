import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "../invoice-document/InvoiceDocument";
import { getInvoiceById, type Invoice } from "../api/invoices";
import type { InvoiceForm } from "../invoice-form/types";
import dayjs from "dayjs";

export default function InvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

    if (!invoice.buyer) {
      throw new Error("Buyer information is missing");
    }

    return {
      invoiceNumber: invoice.invoiceNumber,
      vehicleNumber: invoice.vehicleNumber,
      date: dayjs(invoice.date).format("YYYY-MM-DD"),
      buyer: invoice.buyer,
      items: invoice.items || [],
      discount: Number(invoice.discount),
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      igst: invoice.igst,
      subtotal: Number(invoice.subtotal),
      cgstAmount: (invoice.subtotal * invoice.cgst) / 100,
      sgstAmount: (invoice.subtotal * invoice.sgst) / 100,
      igstAmount: (invoice.subtotal * invoice.igst) / 100,
      total: Number(invoice.total),
      sellerName: invoice.sellerNameSnapshot,
      sellerAddress: invoice.sellerAddressSnapshot,
      sellerEmail: invoice.sellerEmailSnapshot,
      sellerPhone: invoice.sellerPhoneSnapshot,
      sellerGstin: invoice.sellerGstinSnapshot,
      amountInWords: invoice.amountInWords,
    };
  }, [invoice]);

  const handleBack = () => {
    navigate("/invoices");
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
          Back to Invoices
        </Button>
      </Box>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Invoices
        </Button>
      </Box>
      <InvoiceDocument data={invoiceData} ref={invoiceRef} />
    </div>
  );
}
