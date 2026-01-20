import { Loader2, AlertCircle } from "lucide-react";
import type { Invoice } from "../api/invoices";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { updateInvoiceStatus } from "../api/invoices";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import InvoiceStatusChip from "./InvoiceStatusChip";
import InvoiceActionsMenu from "./InvoiceActionsMenu";

interface InvoicesCardViewProps {
  invoices: Invoice[];
  isLoading?: boolean;
  error?: string | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
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

export default function InvoicesCardView({
  invoices,
  isLoading = false,
  error = null,
  onStatusChange,
  onInvoiceArchived,
}: InvoicesCardViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleCardClick = (
    invoice: Invoice,
    event: React.MouseEvent<HTMLDivElement>
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

      <div className="grid grid-cols-1 gap-3">
        {invoices.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No invoices found
          </div>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id} onClick={(e) => handleCardClick(invoice, e)}>
              <CardContent className="">
                <h3
                  className={`text-lg mb-3 text-center ${
                    invoice.status === "archived"
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {invoice.invoiceNumber}
                </h3>
                <div className="space-y-2 text-sm text-left">
                  <div className="text-muted-foreground">
                    Date: {formatDate(invoice.date)}
                  </div>
                  <div className="text-muted-foreground">
                    Buyer: {invoice.buyerNameSnapshot}
                  </div>
                  <div className="text-muted-foreground">
                    Items: {invoice.items?.length || 0}
                  </div>
                  <div className="text-muted-foreground">
                    Total: ₹
                    {invoice.total.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    {updatingStatus === invoice.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <InvoiceStatusChip
                        status={invoice.status}
                        invoiceId={invoice.id}
                        onStatusChange={handleStatusChange}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-0">
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    const returnUrl = encodeURIComponent(location.pathname);
                    navigate(`/invoice/${invoice.id}?returnUrl=${returnUrl}`);
                  }}
                >
                  View
                </Button>
                <InvoiceActionsMenu
                  invoice={invoice}
                  onInvoiceArchived={onInvoiceArchived}
                />
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
