import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { GetInvoicesParams, Invoice } from "../api/invoices";
import type { InvoiceFilters } from "@/invoices/InvoiceFilterToolbar";
import InvoiceFilterToolbar from "@/invoices/InvoiceFilterToolbar";
import InvoicesTable from "../invoices/InvoicesTable";
import InvoicesCardView from "../invoices/InvoicesCardView";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useInvoicesList, invoicesListQueryKey } from "@/hooks/useInvoices";

export default function InvoicesPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const queryClient = useQueryClient();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<InvoiceFilters>(() => {
    const buyerIdFromUrl = searchParams.get("buyerId");
    return {
      invoiceNumber: "",
      buyerId: buyerIdFromUrl || "",
      status: "",
      startDate: "",
      endDate: "",
      showArchived: false,
    };
  });

  const handleFiltersChange = (newFilters: InvoiceFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Build params object, excluding empty string values
  const params: GetInvoicesParams = { page, pageSize };
  if (filters.invoiceNumber) params.invoiceNumber = filters.invoiceNumber;
  if (filters.buyerId) params.buyerId = filters.buyerId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  // Build status array based on showArchived checkbox
  // By default: show pending, paid, cheque_issued
  // If showArchived is true: also include archived
  const statusArray: Array<"pending" | "paid" | "cheque_issued" | "archived"> =
    ["pending", "paid", "cheque_issued"];
  if (filters.showArchived) {
    statusArray.push("archived");
  }
  params.status = statusArray;

  const {
    data,
    isLoading,
    error: errorObj,
  } = useInvoicesList(params);

  const invoices = data?.invoices ?? [];
  const totalCount = data?.pagination.totalCount ?? 0;
  const error = errorObj
    ? errorObj instanceof Error
      ? errorObj.message
      : "Failed to load invoices"
    : null;

  const handleStatusChange = (updatedInvoice: Invoice) => {
    queryClient.setQueryData(
      invoicesListQueryKey(params),
      (old: typeof data) =>
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
      invoicesListQueryKey(params),
      (old: typeof data) =>
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

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <div className="p-4 md:p-8 space-y-4 w-full h-full">
      <InvoiceFilterToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        initialFilterType={filters.buyerId ? "buyer" : "invoiceNumber"}
      />

      {isDesktop ? (
        <>
          <InvoicesTable
            invoices={invoices}
            isLoading={isLoading}
            error={error}
            onStatusChange={handleStatusChange}
            onInvoiceArchived={handleInvoiceArchived}
          />
        </>
      ) : (
        <InvoicesCardView
          invoices={invoices}
          isLoading={isLoading}
          error={error}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onStatusChange={handleStatusChange}
          onInvoiceArchived={handleInvoiceArchived}
        />
      )}

      {!isLoading && totalCount > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-4 *:mx-auto sm:*:mx-0">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalCount)} of {totalCount} invoices
          </p>
          <div className="flex items-center gap-2 ">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
