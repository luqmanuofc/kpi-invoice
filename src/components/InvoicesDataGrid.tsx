import {
  Box,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useNavigate, useLocation } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HistoryIcon from "@mui/icons-material/History";
import type { Invoice } from "../api/invoices";
import { updateInvoiceStatus } from "../api/invoices";
import { useState } from "react";
import StatusLogsModal from "./StatusLogsModal";

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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsInvoiceId, setLogsInvoiceId] = useState<string>("");
  const [logsInvoiceNumber, setLogsInvoiceNumber] = useState<string>("");

  const handleViewClick = (id: string) => {
    const returnUrl = encodeURIComponent(location.pathname);
    navigate(`/invoice/${id}?returnUrl=${returnUrl}`);
  };

  const handleRowClick = (params: any, event: any) => {
    // Don't navigate if clicking on status or actions column
    const target = event.target as HTMLElement;
    const isStatusClick =
      target.closest(".MuiSelect-root") ||
      target.closest(".MuiMenuItem-root") ||
      target.closest('[role="button"]');
    const isActionsClick =
      target.closest(".MuiIconButton-root") ||
      params.field === "actions" ||
      params.field === "status";

    if (!isStatusClick && !isActionsClick) {
      handleViewClick(params.id);
    }
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

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    invoiceId: string
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedInvoiceId(invoiceId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedInvoiceId(null);
  };

  const handleMenuAction = (action: "view" | "duplicate" | "logs") => {
    if (!selectedInvoiceId) return;

    switch (action) {
      case "view":
        handleViewClick(selectedInvoiceId);
        break;
      case "duplicate":
        // TODO: Implement duplicate functionality
        console.log("Duplicate invoice:", selectedInvoiceId);
        break;
      case "logs":
        const invoice = invoices.find((inv) => inv.id === selectedInvoiceId);
        if (invoice) {
          setLogsInvoiceId(selectedInvoiceId);
          setLogsInvoiceNumber(invoice.invoiceNumber);
          setLogsModalOpen(true);
        }
        break;
    }

    handleMenuClose();
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
      valueFormatter: (value) => {
        return new Date(value).toLocaleDateString();
      },
      renderCell: (params) => <>{params.value}</>,
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
      width: 80,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => handleMenuOpen(e, params.row.id)}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
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
          onCellClick={handleRowClick}
          sx={{
            "& .MuiDataGrid-row": {
              cursor: "pointer",
            },
          }}
        />
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={() => handleMenuAction("view")}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Invoice</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("duplicate")}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate Invoice</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("logs")}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Logs</ListItemText>
        </MenuItem>
      </Menu>

      <StatusLogsModal
        open={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        invoiceId={logsInvoiceId}
        invoiceNumber={logsInvoiceNumber}
      />
    </Box>
  );
}
