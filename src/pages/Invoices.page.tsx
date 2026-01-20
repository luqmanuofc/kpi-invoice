import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getInvoices, type Invoice } from "../api/invoices";
import type { InvoiceFilters } from "@/invoices/InvoiceFilterToolbar";
import InvoiceFilterToolbar from "@/invoices/InvoiceFilterToolbar";
import InvoicesTable from "../invoices/InvoicesTable";
import InvoicesCardView from "../invoices/InvoicesCardView";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function InvoicesPage() {
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build params object, excluding empty string values
        const params: any = { page, pageSize };

        if (filters.invoiceNumber) params.invoiceNumber = filters.invoiceNumber;
        if (filters.buyerId) params.buyerId = filters.buyerId;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        // Build status array based on showArchived checkbox
        // By default: show pending, paid
        // If showArchived is true: also include archived
        const statusArray: Array<"pending" | "paid" | "archived"> = [
          "pending",
          "paid",
        ];
        if (filters.showArchived) {
          statusArray.push("archived");
        }
        params.status = statusArray;

        const data = await getInvoices(params);
        setInvoices(data.invoices);
        setTotalCount(data.pagination.totalCount);
      } catch (err: any) {
        setError(err.message || "Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [page, pageSize, filters]);

  const handleStatusChange = (updatedInvoice: Invoice) => {
    setInvoices((prevInvoices) =>
      prevInvoices.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      )
    );
  };

  const handleInvoiceArchived = (archivedInvoice: Invoice) => {
    // Remove the archived invoice from the list
    setInvoices((prevInvoices) =>
      prevInvoices.filter((invoice) => invoice.id !== archivedInvoice.id)
    );
    // Update total count
    setTotalCount((prevCount) => prevCount - 1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <div className="p-8 space-y-4 w-full h-full">
      <InvoiceFilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
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
