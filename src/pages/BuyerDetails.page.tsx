import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getBuyerById, type Buyer } from "../api/buyers";
import { getInvoices, type Invoice } from "../api/invoices";
import InvoicesDataGrid from "../components/InvoicesDataGrid";

export default function BuyerDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        const buyerData = await getBuyerById(id);
        setBuyer(buyerData);
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

  const handleBack = () => {
    navigate("/buyer");
  };

  const handleEdit = () => {
    navigate(`/buyer/edit/${id}`);
  };

  if (isFetching) {
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

  return (
    <Box sx={{ margin: "2rem" }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/buyer"
          onClick={(e) => {
            e.preventDefault();
            navigate("/buyer");
          }}
        >
          Buyers
        </Link>
        <Typography>Details</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4">Buyer Details</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {buyer && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {buyer.name}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {buyer.phone || "—"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
                  {buyer.address}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  GSTIN
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {buyer.gstin || "—"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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
  );
}
