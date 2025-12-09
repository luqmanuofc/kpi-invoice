import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getBuyerById,
  updateBuyer,
  type BuyerFormData,
} from "../api/buyers";
import { getInvoices, type Invoice } from "../api/invoices";
import BuyerForm from "../components/BuyerForm";
import InvoicesDataGrid from "../components/InvoicesDataGrid";
import { Box, Typography, Divider } from "@mui/material";

export default function BuyerEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<BuyerFormData | undefined>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesPageSize, setInvoicesPageSize] = useState(10);
  const [invoicesTotalCount, setInvoicesTotalCount] = useState(0);

  useEffect(() => {
    const fetchBuyer = async () => {
      if (!id) {
        setError("Buyer ID is missing");
        setIsFetching(false);
        return;
      }

      try {
        setIsFetching(true);
        setError(null);
        const buyer = await getBuyerById(id);
        setInitialData({
          name: buyer.name,
          address: buyer.address,
          gstin: buyer.gstin || "",
          phone: buyer.phone || "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load buyer");
      } finally {
        setIsFetching(false);
      }
    };

    fetchBuyer();
  }, [id]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!id) {
        setInvoicesLoading(false);
        return;
      }

      try {
        setInvoicesLoading(true);
        setInvoicesError(null);
        const data = await getInvoices({
          buyerId: id,
          page: invoicesPage,
          pageSize: invoicesPageSize,
        });
        setInvoices(data.invoices);
        setInvoicesTotalCount(data.pagination.totalCount);
      } catch (err: any) {
        setInvoicesError(err.message || "Failed to load invoices");
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, [id, invoicesPage, invoicesPageSize]);

  const handleSubmit = async (data: BuyerFormData) => {
    if (!id) {
      setError("Buyer ID is missing");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateBuyer(id, data);
      console.log("Buyer updated:", result);

      // Navigate back to return URL or buyers list after successful update
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate("/buyer");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the buyer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <BuyerForm
        mode="edit"
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
      />

      <Box sx={{ margin: "2rem" }}>
        <Divider sx={{ mb: 4 }} />

        <Typography variant="h5" sx={{ mb: 3 }}>
          Invoices for this Buyer
        </Typography>

        <InvoicesDataGrid
          invoices={invoices}
          isLoading={invoicesLoading}
          error={invoicesError}
          showCheckboxes={false}
          paginationMode="server"
          rowCount={invoicesTotalCount}
          page={invoicesPage - 1}
          pageSize={invoicesPageSize}
          onPageChange={(newPage) => setInvoicesPage(newPage + 1)}
          onPageSizeChange={(newPageSize) => {
            setInvoicesPageSize(newPageSize);
            setInvoicesPage(1);
          }}
        />
      </Box>
    </Box>
  );
}
