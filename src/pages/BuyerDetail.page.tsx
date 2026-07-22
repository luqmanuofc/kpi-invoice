import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBuyer, useBuyerAnalytics, BUYERS_QUERY_KEY } from "@/hooks/useBuyers";
import { useBuyerInvoices, buyerInvoicesQueryKey } from "@/hooks/useInvoices";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Invoice } from "@/api/invoices";
import BuyerDrawer from "@/buyer/BuyerDrawer";
import {
  BuyerAnalyticsSummaryCards,
  BuyerAnalyticsDetailCards,
} from "@/buyer/BuyerAnalytics";
import InvoicesTable from "@/invoices/InvoicesTable";
import InvoicesCardView from "@/invoices/InvoicesCardView";

const INVOICES_PAGE_SIZE = 5;

export default function BuyerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // If we arrived here via in-app navigation (e.g. from the dashboard's top
  // buyers list), go back to wherever that was instead of always the buyer
  // list. Falls back to the buyer list when there's no app history to return
  // to (e.g. a direct link/refresh).
  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/buyer");
    }
  };
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { data: buyer, isLoading, error } = useBuyer(id);
  const { data: analytics, isLoading: analyticsLoading } = useBuyerAnalytics(id);

  const [editOpen, setEditOpen] = useState(false);
  const [invoicePage, setInvoicePage] = useState(1);

  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    error: invoicesErrorObj,
  } = useBuyerInvoices(id, invoicePage, INVOICES_PAGE_SIZE);

  const invoices = invoicesData?.invoices ?? [];
  const totalInvoiceCount = invoicesData?.pagination.totalCount ?? 0;
  const invoicesError = invoicesErrorObj
    ? invoicesErrorObj instanceof Error
      ? invoicesErrorObj.message
      : "Failed to load invoices"
    : null;

  const handleStatusChange = (updatedInvoice: Invoice) => {
    queryClient.setQueryData(
      buyerInvoicesQueryKey(id, invoicePage, INVOICES_PAGE_SIZE),
      (old: typeof invoicesData) =>
        old && {
          ...old,
          invoices: old.invoices.map((invoice) =>
            invoice.id === updatedInvoice.id ? updatedInvoice : invoice
          ),
        }
    );
  };

  const handleInvoiceArchived = (archivedInvoice: Invoice) => {
    queryClient.setQueryData(
      buyerInvoicesQueryKey(id, invoicePage, INVOICES_PAGE_SIZE),
      (old: typeof invoicesData) =>
        old && {
          ...old,
          invoices: old.invoices.filter(
            (invoice) => invoice.id !== archivedInvoice.id
          ),
          pagination: {
            ...old.pagination,
            totalCount: old.pagination.totalCount - 1,
          },
        }
    );
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: BUYERS_QUERY_KEY });
  };

  if (isLoading) {
    return (
      <div className="w-full h-full md:min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !buyer) {
    return (
      <div className="p-4 md:p-8 w-full h-full space-y-4">
        <Alert variant="destructive">
          {error instanceof Error ? error.message : "Buyer not found"}
        </Alert>
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  const totalInvoicePages = Math.ceil(totalInvoiceCount / INVOICES_PAGE_SIZE);
  const hasNextInvoicePage = invoicePage < totalInvoicePages;
  const hasPrevInvoicePage = invoicePage > 1;

  return (
    <div className="w-full h-full p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold">{buyer.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Buyer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grow space-y-2">
            <p className="text-sm text-muted-foreground text-left">
              <strong>Address:</strong> {buyer.address}
            </p>
            <p className="text-sm text-muted-foreground text-left">
              <strong>GSTIN:</strong> {buyer.gstin || "—"}
            </p>
            <p className="text-sm text-muted-foreground text-left">
              <strong>Phone:</strong> {buyer.phone || "—"}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0">
            <Button size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </CardFooter>
        </Card>

        {analyticsLoading ? (
          <div className="md:col-span-2 flex justify-center items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          analytics && <BuyerAnalyticsSummaryCards data={analytics} />
        )}
      </div>

      {analytics && <BuyerAnalyticsDetailCards data={analytics} />}

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-muted-foreground">
            Invoices
          </h2>
          <Button
            variant="link"
            size="sm"
            className="px-0"
            onClick={() => navigate(`/invoices?buyerId=${buyer.id}`)}
          >
            View all invoices
          </Button>
        </div>

        {isDesktop ? (
          <InvoicesTable
            invoices={invoices}
            isLoading={invoicesLoading}
            error={invoicesError}
            onStatusChange={handleStatusChange}
            onInvoiceArchived={handleInvoiceArchived}
          />
        ) : (
          <InvoicesCardView
            invoices={invoices}
            isLoading={invoicesLoading}
            error={invoicesError}
            onStatusChange={handleStatusChange}
            onInvoiceArchived={handleInvoiceArchived}
          />
        )}

        {!invoicesLoading && totalInvoiceCount > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-4 *:mx-auto sm:*:mx-0">
            <p className="text-sm text-muted-foreground">
              Showing {(invoicePage - 1) * INVOICES_PAGE_SIZE + 1} to{" "}
              {Math.min(invoicePage * INVOICES_PAGE_SIZE, totalInvoiceCount)} of{" "}
              {totalInvoiceCount} invoices
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvoicePage((p) => p - 1)}
                disabled={!hasPrevInvoicePage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {invoicePage} of {totalInvoicePages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvoicePage((p) => p + 1)}
                disabled={!hasNextInvoicePage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <BuyerDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        buyerId={buyer.id}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
