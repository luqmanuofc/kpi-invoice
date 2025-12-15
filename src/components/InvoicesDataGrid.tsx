import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useNavigate, useLocation } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { Invoice } from "../api/invoices";
import { updateInvoiceStatus } from "../api/invoices";
import { useState } from "react";

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
  onStatusChange?: (updatedInvoice: Invoice) => void;
}

export default function InvoicesDataGrid({
  invoices,
  isLoading = false,
  error = null,
  showCheckboxes = false,
  paginationMode = "client",
  rowCount,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onStatusChange,
}: InvoicesDataGridProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleViewClick = (id: string) => {
    const returnUrl = encodeURIComponent(location.pathname);
    navigate(`/invoice/${id}?returnUrl=${returnUrl}`);
  };

  const handleBuyerClick = (buyerId: string) => {
    navigate(`/buyer/${buyerId}`);
  };

  const handleStatusChange = async (
    invoiceId: string,
    newStatus: "pending" | "paid" | "void"
  ) => {
    setUpdatingStatus(invoiceId);
    try {
      const updatedInvoice = await updateInvoiceStatus(invoiceId, newStatus);
      onStatusChange?.(updatedInvoice);
    } catch (error) {
      console.error("Failed to update invoice status:", error);
    } finally {
      setUpdatingStatus(null);
    }
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
      minWidth: 150,
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
      field: "items",
      headerName: "Total Items",
      width: 110,
      sortable: true,
      valueGetter: (value: Invoice["items"]) => {
        return value?.length || 0;
      },
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
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        const isUpdating = updatingStatus === params.row.id;
        return (
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            {isUpdating ? (
              <CircularProgress size={20} />
            ) : (
              <Select
                value={params.row.status}
                onChange={(e) =>
                  handleStatusChange(
                    params.row.id,
                    e.target.value as "pending" | "paid" | "void"
                  )
                }
                size="small"
                sx={{ width: "100%" }}
              >
                <MenuItem value="pending">
                  <Chip label="Pending" color="warning" size="small" />
                </MenuItem>
                <MenuItem value="paid">
                  <Chip label="Paid" color="success" size="small" />
                </MenuItem>
                <MenuItem value="void">
                  <Chip label="Void" color="error" size="small" />
                </MenuItem>
              </Select>
            )}
          </Box>
        );
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
