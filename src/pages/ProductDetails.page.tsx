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
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getProductById, type Product, type ProductCategory } from "../api/products";
import { getInvoices, type Invoice } from "../api/invoices";
import InvoicesDataGrid from "../components/InvoicesDataGrid";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  PVC_PIPE: "PVC Pipe",
  PVC_BEND: "PVC Bend",
  PVC_CHANNEL: "PVC Channel",
  WIRE: "Wire",
  ELECTRICAL_ACCESSORY: "Electrical Accessory",
};

export default function ProductDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesPageSize, setInvoicesPageSize] = useState(10);
  const [invoicesTotalCount, setInvoicesTotalCount] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID is missing");
        setIsFetching(false);
        return;
      }

      try {
        setIsFetching(true);
        setError(null);
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setIsFetching(false);
      }
    };

    fetchProduct();
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
          productId: id,
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
    navigate("/products");
  };

  const handleEdit = () => {
    navigate(`/products/edit/${id}`);
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
          href="/products"
          onClick={(e) => {
            e.preventDefault();
            navigate("/products");
          }}
        >
          Products
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
        <Typography variant="h4">Product Details</Typography>
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

      {product && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {product.name}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Category
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={CATEGORY_LABELS[product.category]}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  HSN Code
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {product.hsn || "—"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Default Price
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  ₹
                  {product.defaultPrice.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Divider sx={{ mb: 4 }} />

      <Typography variant="h5" sx={{ mb: 3 }}>
        Recent Invoices with this Product
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
