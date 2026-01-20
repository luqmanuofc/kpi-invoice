import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !isArchiving && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Invoice</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive invoice{" "}
            <strong className="text-foreground">{invoiceNumber}</strong>?
            <br />
            <br />
            The invoice will be hidden from the active invoices list and its
            invoice number can be used again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isArchiving}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isArchiving}
          >
            {isArchiving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isArchiving ? "Archiving..." : "Archive"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
