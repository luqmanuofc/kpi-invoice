import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProducts, type Product, type ProductCategory } from "../api/products";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  PVC_PIPE: "PVC Pipe",
  PVC_BEND: "PVC Bend",
  PVC_CHANNEL: "PVC Channel",
  WIRE: "Wire",
  ELECTRICAL_ACCESSORY: "Electrical Accessory",
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProducts();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCreateClick = () => {
    navigate("/products/create");
  };

  const handleRowClick = (params: any) => {
    navigate(`/products/${params.id}`);
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
    {
      field: "category",
      headerName: "Category",
      width: 180,
      renderCell: (params) => (
        <Chip
          label={CATEGORY_LABELS[params.value as ProductCategory]}
          size="small"
          variant="outlined"
        />
      ),
    },
    { field: "hsn", headerName: "HSN Code", width: 130 },
    {
      field: "defaultPrice",
      headerName: "Price",
      width: 120,
      valueFormatter: (value: number) => {
        return `₹${value.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
  ];

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

  return (
    <div style={{ margin: "2rem" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignContent={"center"}
        p={1}
      >
        <Typography variant="h6" sx={{ mb: 3 }}>
          Products
        </Typography>
        <div>
          {" "}
          <Button variant="outlined" size="small" onClick={handleCreateClick}>
            Create
          </Button>
        </div>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={products}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
            columns: {
              columnVisibilityModel: {},
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          onRowClick={handleRowClick}
          sx={{
            "& .MuiDataGrid-row": {
              cursor: "pointer",
            },
          }}
        />
      </Box>
    </div>
  );
}
