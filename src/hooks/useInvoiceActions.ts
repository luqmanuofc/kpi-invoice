import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { updateInvoiceStatus } from "../api/invoices";
import type { Invoice } from "../api/invoices";

export function useInvoiceActions(onStatusChange?: (updatedInvoice: Invoice) => void) {
  const navigate = useNavigate();
  const location = useLocation();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsInvoiceId, setLogsInvoiceId] = useState<string>("");
  const [logsInvoiceNumber, setLogsInvoiceNumber] = useState<string>("");

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
    action: "view" | "duplicate" | "logs",
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
    }

    handleMenuClose();
  };

  return {
    updatingStatus,
    menuAnchorEl,
    selectedInvoiceId,
    logsModalOpen,
    logsInvoiceId,
    logsInvoiceNumber,
    handleViewClick,
    handleStatusChange,
    handleMenuOpen,
    handleMenuClose,
    handleMenuAction,
    setLogsModalOpen,
  };
}
