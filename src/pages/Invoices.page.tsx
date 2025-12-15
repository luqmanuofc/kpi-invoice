import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getInvoices, type Invoice } from "../api/invoices";
import InvoicesDataGrid from "../components/InvoicesDataGrid";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getInvoices({ page, pageSize });
        setInvoices(data.invoices);
        setTotalCount(data.pagination.totalCount);
      } catch (err: any) {
        setError(err.message || "Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [page, pageSize]);

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
