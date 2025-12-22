import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
} from "@mui/material";
import { useEffect, useState } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { getInvoiceStatusLogs, type InvoiceStatusLog } from "../api/invoices";

interface StatusLogsModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber?: string;
}

export default function StatusLogsModal({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
}: StatusLogsModalProps) {
  const [logs, setLogs] = useState<InvoiceStatusLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && invoiceId) {
      fetchLogs();
    }
  }, [open, invoiceId]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvoiceStatusLogs(invoiceId);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load status logs");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (
    status: string
  ): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Status Change History
        {invoiceNumber && (
          <Typography variant="body2" color="text.secondary">
            Invoice #{invoiceNumber}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "200px",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isLoading && !error && logs.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">
              No status changes recorded yet
            </Typography>
          </Box>
        )}

        {!isLoading && !error && logs.length > 0 && (
          <Stack spacing={2}>
            {logs.map((log) => (
              <Paper
                key={log.id}
                elevation={1}
                sx={{
                  p: 2,
                  borderLeft: 4,
                  borderColor: `${getStatusColor(log.newStatus)}.main`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Chip
                    label={getStatusLabel(log.oldStatus)}
                    color={getStatusColor(log.oldStatus)}
                    size="small"
                  />
                  <ArrowForwardIcon fontSize="small" color="action" />
                  <Chip
                    label={getStatusLabel(log.newStatus)}
                    color={getStatusColor(log.newStatus)}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(log.changedAt)}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
