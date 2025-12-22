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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const handleViewClick = (id: string) => {
    const returnUrl = encodeURIComponent(location.pathname);
    navigate(`/invoice/${id}?returnUrl=${returnUrl}`);
  };

  const handleStatusChange = async (
    invoiceId: string,
    newStatus: "pending" | "paid"
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
    invoice: Invoice
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleMenuAction = (
    action: "view" | "duplicate" | "logs" | "archive"
  ) => {
    if (!selectedInvoice) return;

    switch (action) {
      case "view":
        handleViewClick(selectedInvoice.id);
        break;
      case "duplicate":
        // TODO: Implement duplicate functionality
        console.log("Duplicate invoice:", selectedInvoice.id);
        handleMenuClose();
        break;
      case "logs":
        setLogsModalOpen(true);
        handleMenuClose();
        break;
      case "archive":
        setArchiveDialogOpen(true);
        break;
    }
  };

  const handleArchiveConfirm = async () => {
    if (!selectedInvoice) return;

    setArchiving(true);
    try {
      const archivedInvoice = await archiveInvoice(selectedInvoice.id);
      onInvoiceArchived?.(archivedInvoice);
      setArchiveDialogOpen(false);
    } catch (error) {
      console.error("Failed to archive invoice:", error);
    } finally {
      setArchiving(false);
      handleMenuClose();
    }
  };

  const handleArchiveDialogClose = () => {
    if (!archiving) {
      setArchiveDialogOpen(false);
    }
  };

  return {
    updatingStatus,
    menuAnchorEl,
    selectedInvoice,
    logsModalOpen,
    archiveDialogOpen,
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
