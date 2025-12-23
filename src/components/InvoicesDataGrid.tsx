import {
  Box,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { Invoice } from "../api/invoices";
import { useInvoiceActions } from "../hooks/useInvoiceActions";
import StatusLogsModal from "./StatusLogsModal";
import InvoiceActionsMenu from "./InvoiceActionsMenu";
import ArchiveInvoiceDialog from "./ArchiveInvoiceDialog";
import InvoiceStatusChip from "./InvoiceStatusChip";

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
  onInvoiceArchived?: (archivedInvoice: Invoice) => void;
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
  onInvoiceArchived,
}: InvoicesDataGridProps) {
  const {
    updatingStatus,
    menuAnchorEl,
    logsModalOpen,
    archiveDialogOpen,
    selectedInvoice,
    archiving,
    handleViewClick,
    handleStatusChange,
    handleMenuOpen,
    handleMenuClose,
    handleMenuAction,
    setLogsModalOpen,
    handleArchiveConfirm,
    handleArchiveDialogClose,
  } = useInvoiceActions(onStatusChange, onInvoiceArchived);

  const handleRowClick = (params: any, event: any) => {
    // Don't navigate if clicking on status or actions column
    const target = event.target as HTMLElement;
    const isStatusClick =
      target.closest(".MuiChip-root") ||
      target.closest(".MuiMenu-root") ||
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

  const columns: GridColDef[] = [
    {
      field: "invoiceNumber",
      headerName: "Invoice #",
      width: 130,
      renderCell: (params) => (
        <span style={{
          textDecoration: params.row.status === "archived" ? "line-through" : "none"
        }}>
          {params.value}
        </span>
      ),
    },
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            {isUpdating ? (
              <CircularProgress size={20} />
            ) : (
              <InvoiceStatusChip
                status={params.row.status}
                invoiceId={params.row.id}
                onStatusChange={handleStatusChange}
              />
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
        <IconButton onClick={(e) => handleMenuOpen(e, params.row)} size="small">
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

      <InvoiceActionsMenu
        anchorEl={menuAnchorEl}
        onClose={handleMenuClose}
        onMenuAction={handleMenuAction}
        invoices={invoices}
        selectedInvoiceId={selectedInvoice?.id ?? ""}
      />

      <StatusLogsModal
        open={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        invoiceId={selectedInvoice?.id ?? ""}
        invoiceNumber={selectedInvoice?.invoiceNumber}
      />

      <ArchiveInvoiceDialog
        open={archiveDialogOpen}
        onClose={handleArchiveDialogClose}
        onConfirm={handleArchiveConfirm}
        invoiceNumber={selectedInvoice?.invoiceNumber ?? ""}
        isArchiving={archiving}
      />
    </Box>
  );
}
