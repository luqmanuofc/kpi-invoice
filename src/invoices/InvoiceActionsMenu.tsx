import { useState } from "react";
import { Eye, Copy, History, Archive, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useInvoice } from "../contexts/InvoiceProvider";
import type { Invoice } from "../api/invoices";
import StatusLogsModal from "./StatusLogsModal";
import ArchiveInvoiceDialog from "./ArchiveInvoiceDialog";
import { archiveInvoice } from "../api/invoices";

interface InvoiceActionsMenuProps {
  invoice: Invoice;
  onInvoiceArchived?: (archivedInvoice: Invoice) => void;
}

export default function InvoiceActionsMenu({
  invoice,
  onInvoiceArchived,
}: InvoiceActionsMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { duplicateInvoice } = useInvoice();
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const isArchived = invoice.status === "archived";

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    const returnUrl = encodeURIComponent(location.pathname);
    navigate(`/invoice/${invoice.id}?returnUrl=${returnUrl}`);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateInvoice(invoice);
  };

  const handleViewLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogsModalOpen(true);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async () => {
    setArchiving(true);
    try {
      const archivedInvoice = await archiveInvoice(invoice.id);
      onInvoiceArchived?.(archivedInvoice);
      setArchiveDialogOpen(false);
    } catch (error) {
      console.error("Failed to archive invoice:", error);
    } finally {
      setArchiving(false);
    }
  };

  const handleArchiveDialogClose = () => {
    if (!archiving) {
      setArchiveDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Invoice</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate Invoice</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewLogs}>
            <History className="mr-2 h-4 w-4" />
            <span>View Logs</span>
          </DropdownMenuItem>
          {!isArchived && (
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              <span>Archive Invoice</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <StatusLogsModal
        open={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
      />

      <ArchiveInvoiceDialog
        open={archiveDialogOpen}
        onClose={handleArchiveDialogClose}
        onConfirm={handleArchiveConfirm}
        invoiceNumber={invoice.invoiceNumber}
        isArchiving={archiving}
      />
    </>
  );
}
