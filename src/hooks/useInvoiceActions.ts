import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { updateInvoiceStatus, archiveInvoice } from "../api/invoices";
import type { Invoice } from "../api/invoices";

export function useInvoiceActions(
  onStatusChange?: (updatedInvoice: Invoice) => void,
  onInvoiceArchived?: (archivedInvoice: Invoice) => void
) {
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
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveInvoiceId, setArchiveInvoiceId] = useState<string>("");
  const [archiveInvoiceNumber, setArchiveInvoiceNumber] = useState<string>("");
  const [archiving, setArchiving] = useState(false);

  const handleViewClick = (id: string) => {
    const returnUrl = encodeURIComponent(location.pathname);
    navigate(`/invoice/${id}?returnUrl=${returnUrl}`);
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

  const handleMenuAction = (
    action: "view" | "duplicate" | "logs" | "archive",
    invoices: Invoice[]
  ) => {
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
      case "archive":
        const invoiceToArchive = invoices.find(
          (inv) => inv.id === selectedInvoiceId
        );
        if (invoiceToArchive) {
          setArchiveInvoiceId(selectedInvoiceId);
          setArchiveInvoiceNumber(invoiceToArchive.invoiceNumber);
          setArchiveDialogOpen(true);
        }
        break;
    }

    handleMenuClose();
  };

  const handleArchiveConfirm = async () => {
    if (!archiveInvoiceId) return;

    setArchiving(true);
    try {
      const archivedInvoice = await archiveInvoice(archiveInvoiceId);
      onInvoiceArchived?.(archivedInvoice);
      setArchiveDialogOpen(false);
      setArchiveInvoiceId("");
      setArchiveInvoiceNumber("");
    } catch (error) {
      console.error("Failed to archive invoice:", error);
    } finally {
      setArchiving(false);
    }
  };

  const handleArchiveDialogClose = () => {
    if (!archiving) {
      setArchiveDialogOpen(false);
      setArchiveInvoiceId("");
      setArchiveInvoiceNumber("");
    }
  };

  return {
    updatingStatus,
    menuAnchorEl,
    selectedInvoiceId,
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
  };
}
