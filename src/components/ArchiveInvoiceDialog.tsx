import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";

interface ArchiveInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  invoiceNumber: string;
  isArchiving?: boolean;
}

export default function ArchiveInvoiceDialog({
  open,
  onClose,
  onConfirm,
  invoiceNumber,
  isArchiving = false,
}: ArchiveInvoiceDialogProps) {
  return (
    <Dialog open={open} onClose={isArchiving ? undefined : onClose}>
      <DialogTitle>Archive Invoice</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to archive invoice{" "}
          <strong>{invoiceNumber}</strong>?
          <br />
          <br />
          The invoice will be hidden from the active invoices list and its
          invoice number can be used again.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={isArchiving}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="warning"
          autoFocus
          disabled={isArchiving}
          startIcon={isArchiving ? <CircularProgress size={20} /> : null}
        >
          {isArchiving ? "Archiving..." : "Archive"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
