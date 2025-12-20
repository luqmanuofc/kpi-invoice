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
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Pagination,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HistoryIcon from "@mui/icons-material/History";
import type { Invoice } from "../api/invoices";
import { useInvoiceActions } from "../hooks/useInvoiceActions";
import StatusLogsModal from "./StatusLogsModal";

interface InvoicesCardViewProps {
  invoices: Invoice[];
  error?: string | null;
  page?: number;
  pageSize?: number;
  rowCount?: number;
  onPageChange?: (page: number) => void;
  onStatusChange?: (updatedInvoice: Invoice) => void;
}

export default function InvoicesCardView({
  invoices,
  error = null,
  page = 0,
  pageSize = 10,
  rowCount,
  onPageChange,
  onStatusChange,
}: InvoicesCardViewProps) {
  const {
    updatingStatus,
    menuAnchorEl,
    logsModalOpen,
    logsInvoiceId,
    logsInvoiceNumber,
    handleViewClick,
    handleStatusChange,
    handleMenuOpen,
    handleMenuClose,
    handleMenuAction,
    setLogsModalOpen,
  } = useInvoiceActions(onStatusChange);

  const totalPages = Math.ceil((rowCount || invoices.length) / pageSize);

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
        <MenuItem onClick={() => handleMenuAction("view", invoices)}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Invoice</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("duplicate", invoices)}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate Invoice</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction("logs", invoices)}>
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
