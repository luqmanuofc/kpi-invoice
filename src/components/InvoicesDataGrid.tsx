import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { Invoice } from "../api/invoices";

interface InvoicesDataGridProps {
  invoices: Invoice[];
  isLoading?: boolean;
  error?: string | null;
  showCheckboxes?: boolean;
  paginationMode?: "client" | "server";
  rowCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export default function InvoicesDataGrid({
  invoices,
  isLoading = false,
  error = null,
  showCheckboxes = true,
  paginationMode = "client",
  rowCount,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}: InvoicesDataGridProps) {
  const navigate = useNavigate();

  const handleViewClick = (id: string) => {
    navigate(`/invoice/${id}`);
  };

  const handleBuyerClick = (buyerId: string) => {
    navigate(`/buyer/${buyerId}`);
  };

  const columns: GridColDef[] = [
    { field: "invoiceNumber", headerName: "Invoice #", width: 130 },
    {
      field: "date",
      headerName: "Date",
      width: 120,
      valueFormatter: (value) => {
        return new Date(value).toLocaleDateString();
      },
    },
    {
      field: "buyerNameSnapshot",
      headerName: "Buyer",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box
          sx={{
            cursor: "pointer",
            color: "primary.main",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
          onClick={() => handleBuyerClick(params.row.buyerId)}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: "vehicleNumber",
      headerName: "Vehicle",
      width: 130,
    },
    {
      field: "items",
      headerName: "Total Items",
      width: 110,
      sortable: true,
      valueGetter: (value: Invoice["items"]) => {
        return value?.length || 0;
      },
    },
    {
      field: "itemDescriptions",
      headerName: "Items",
      flex: 1,
      minWidth: 300,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", py: 0.5 }}>
          {params.row.items?.map((item: any, index: number) => (
            <Chip
              key={index}
              label={item.description}
              size="small"
              variant="outlined"
            />
          )) || null}
        </Box>
      ),
    },
    {
      field: "total",
      headerName: "Total",
      width: 130,
      valueFormatter: (value: number) => {
        return `₹${value.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            startIcon={<VisibilityIcon />}
            variant="outlined"
            onClick={() => handleViewClick(params.row.id)}
          >
            View
          </Button>
        </Box>
      ),
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
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={invoices}
          columns={columns}
          paginationMode={paginationMode}
          rowCount={rowCount}
          loading={isLoading}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            if (model.page !== page) {
              onPageChange?.(model.page);
            }
            if (model.pageSize !== pageSize) {
              onPageSizeChange?.(model.pageSize);
            }
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection={showCheckboxes}
        />
      </Box>
    </Box>
  );
}
