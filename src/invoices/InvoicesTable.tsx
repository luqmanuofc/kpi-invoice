import { Loader2, AlertCircle } from "lucide-react";
import type { Invoice } from "../api/invoices";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { updateInvoiceStatus } from "../api/invoices";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import InvoiceStatusChip from "./InvoiceStatusChip";
import InvoiceActionsMenu from "./InvoiceActionsMenu";

interface InvoicesTableProps {
  invoices: Invoice[];
  isLoading?: boolean;
  error?: string | null;
  onStatusChange?: (updatedInvoice: Invoice) => void;
  onInvoiceArchived?: (archivedInvoice: Invoice) => void;
}

const formatDate = (date: Date | string): React.ReactNode => {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  const year = d.getFullYear().toString();

  const suffix = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return (
    <>
      {day}
      <sup>{suffix(day)}</sup> {month} {year}
    </>
  );
};

export default function InvoicesTable({
  invoices,
  isLoading = false,
  error = null,
  onStatusChange,
  onInvoiceArchived,
}: InvoicesTableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleRowClick = (
    invoice: Invoice,
    event: React.MouseEvent<HTMLTableRowElement>
  ) => {
    const target = event.target as HTMLElement;
    const isInteractiveClick =
      target.closest("button") || target.closest('[role="button"]');

    if (!isInteractiveClick) {
      const returnUrl = encodeURIComponent(location.pathname);
      navigate(`/invoice/${invoice.id}?returnUrl=${returnUrl}`);
    }
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  onClick={(e) => handleRowClick(invoice, e)}
                  className="cursor-pointer"
                >
                  <TableCell className="text-left">
                    <span
                      className={
                        invoice.status === "archived"
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      {invoice.invoiceNumber}
                    </span>
                  </TableCell>
                  <TableCell className="text-left">
                    {formatDate(invoice.date)}
                  </TableCell>
                  <TableCell className="text-left">
                    {invoice.buyerNameSnapshot}
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.items?.length || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹
                    {invoice.total.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    {updatingStatus === invoice.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <InvoiceStatusChip
                        status={invoice.status}
                        invoiceId={invoice.id}
                        onStatusChange={handleStatusChange}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <InvoiceActionsMenu
                      invoice={invoice}
                      onInvoiceArchived={onInvoiceArchived}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
