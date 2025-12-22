import {
  Box,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Pagination,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { Invoice } from "../api/invoices";
import { useInvoiceActions } from "../hooks/useInvoiceActions";
import StatusLogsModal from "./StatusLogsModal";
import InvoiceActionsMenu from "./InvoiceActionsMenu";
import ArchiveInvoiceDialog from "./ArchiveInvoiceDialog";

interface InvoicesCardViewProps {
  invoices: Invoice[];
  isLoading?: boolean;
  error?: string | null;
  page?: number;
  pageSize?: number;
  rowCount?: number;
  onPageChange?: (page: number) => void;
  onStatusChange?: (updatedInvoice: Invoice) => void;
  onInvoiceArchived?: (archivedInvoice: Invoice) => void;
}

export default function InvoicesCardView({
  invoices,
  isLoading = false,
  error = null,
  page = 0,
  pageSize = 10,
  rowCount,
  onPageChange,
  onStatusChange,
  onInvoiceArchived,
}: InvoicesCardViewProps) {
  const {
    updatingStatus,
    menuAnchorEl,
    logsModalOpen,
    logsInvoiceId,
    logsInvoiceNumber,
    archiveDialogOpen,
    archiveInvoiceNumber,
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

  const totalPages = Math.ceil((rowCount || invoices.length) / pageSize);

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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 2,
          mb: 3,
        }}
      >
        {invoices.map((invoice) => (
          <Card
            key={invoice.id}
            sx={{
              width: "100%",
              borderRadius: 2,
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "grey.200",
              "&:hover": {
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                transform: "translateY(-4px)",
                bgcolor: "background.paper",
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div" gutterBottom>
                {invoice.invoiceNumber}
              </Typography>
              <Typography
                variant="body2"
                align="left"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                <strong>Date:</strong>{" "}
                {new Date(invoice.date).toLocaleDateString()}
              </Typography>
              <Typography
                variant="body2"
                align="left"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                <strong>Buyer:</strong> {invoice.buyerNameSnapshot}
              </Typography>
              <Typography
                variant="body2"
                align="left"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                <strong>Items:</strong> {invoice.items?.length || 0}
              </Typography>
              <Typography
                variant="body2"
                align="left"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                <strong>Total:</strong> ₹
                {invoice.total.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <Typography
                  variant="body2"
                  align="left"
                  color="text.secondary"
                  sx={{ mr: 1 }}
                >
                  <strong>Status:</strong>
                </Typography>
                {updatingStatus === invoice.id ? (
                  <CircularProgress size={20} />
                ) : (
                  <Select
                    value={invoice.status}
                    onChange={(e) =>
                      handleStatusChange(
                        invoice.id,
                        e.target.value as "pending" | "paid" | "void"
                      )
                    }
                    size="small"
                    sx={{ minWidth: 120 }}
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
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", p: 2, pt: 0 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleViewClick(invoice.id)}
              >
                View
              </Button>
              <IconButton
                onClick={(e) => handleMenuOpen(e, invoice.id)}
                size="small"
              >
                <MoreVertIcon />
              </IconButton>
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Custom Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page + 1}
          onChange={(_, newPage) => onPageChange?.(newPage - 1)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>

      <InvoiceActionsMenu
        anchorEl={menuAnchorEl}
        onClose={handleMenuClose}
        onMenuAction={handleMenuAction}
        invoices={invoices}
      />

      <StatusLogsModal
        open={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        invoiceId={logsInvoiceId}
        invoiceNumber={logsInvoiceNumber}
      />

      <ArchiveInvoiceDialog
        open={archiveDialogOpen}
        onClose={handleArchiveDialogClose}
        onConfirm={handleArchiveConfirm}
        invoiceNumber={archiveInvoiceNumber}
        isArchiving={archiving}
      />
    </Box>
  );
}
