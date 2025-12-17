import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getInvoices, type Invoice } from "../api/invoices";
import InvoicesDataGrid from "../components/InvoicesDataGrid";
import InvoiceFilterToolbar, {
  type InvoiceFilters,
} from "../components/InvoiceFilterToolbar";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<InvoiceFilters>({
    invoiceNumber: "",
    buyerId: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build params object, excluding empty string values
        const params: any = { page, pageSize };

        if (filters.invoiceNumber) params.invoiceNumber = filters.invoiceNumber;
        if (filters.buyerId) params.buyerId = filters.buyerId;
        if (filters.status) params.status = filters.status;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const data = await getInvoices(params);
        setInvoices(data.invoices);
        setTotalCount(data.pagination.totalCount);
      } catch (err: any) {
        setError(err.message || "Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [page, pageSize, filters]);

  const handleCreateClick = () => {
    navigate("/");
  };

  const handleStatusChange = (updatedInvoice: Invoice) => {
    setInvoices((prevInvoices) =>
      prevInvoices.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      )
    );
  };

  return (
    <div style={{ margin: "2rem" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignContent={"center"}
        p={1}
      >
        <Typography variant="h6" sx={{ mb: 3 }}>
          Invoices
        </Typography>
        <div>
          <Button variant="outlined" size="small" onClick={handleCreateClick}>
            Create
          </Button>
        </div>
      </Box>

      <InvoiceFilterToolbar filters={filters} onFiltersChange={setFilters} />

      <InvoicesDataGrid
        invoices={invoices}
        isLoading={isLoading}
        error={error}
        showCheckboxes={false}
        paginationMode="server"
        rowCount={totalCount}
        page={page - 1}
        pageSize={pageSize}
        onPageChange={(newPage) => setPage(newPage + 1)}
        onPageSizeChange={(newPageSize) => {
          setPageSize(newPageSize);
          setPage(1);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
