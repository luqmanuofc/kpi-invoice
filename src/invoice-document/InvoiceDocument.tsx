// InvoiceDocument.tsx
import "./InvoiceDocument.css";
import { forwardRef, useImperativeHandle, useState } from "react";
import InvoicePage from "./InvoicePage";
import { useInvoicePaginator } from "./useInvoicePaginator";
import type { InvoiceForm } from "../invoice-form/types";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type InvoiceDocumentHandle = {
  getPageElements: () => HTMLDivElement[];
};

type Props = {
  data: InvoiceForm;
  transformOrigin?: "top left" | "top center";
};

const InvoiceDocument = forwardRef<InvoiceDocumentHandle, Props>(
  ({ data, transformOrigin }, ref) => {
    const { pages, probeRootRef } = useInvoicePaginator(data);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    let pageRefs: HTMLDivElement[] = [];

    useImperativeHandle(ref, () => ({
      getPageElements: () => pageRefs,
    }));

    const handlePrevPage = () => {
      setCurrentPageIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
      setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
    };

    return (
      <div>
        {/* Hidden probe area */}
        <div
          ref={probeRootRef}
          style={{
            position: "absolute",
            left: "-99999px",
            top: "-99999px",
            visibility: "hidden",
            pointerEvents: "none",
          }}
        />

        <div className="invoice-page-wrapper">
          {/* Visible paginated pages - show only current page */}
          {pages.map((p, idx) => {
            const items = data.items.slice(p.startRow, p.endRow);
            return (
              <div
                key={idx}
                ref={(el) => {
                  if (el) pageRefs[idx] = el;
                }}
                className="invoice-page"
                style={{
                  display: idx === currentPageIndex ? "block" : "none",
                  transformOrigin,
                }}
              >
                <InvoicePage
                  data={data}
                  items={items}
                  showTotals={p.showTotals}
                  showWords={p.showWords}
                  showFooter={p.showFooter}
                  rowStartIndex={p.startRow}
                  isFirstPage={idx === 0}
                  pageNumber={p.pageNumber}
                  totalPages={p.totalPages}
                />
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        {pages.length > 1 && (
          <div className="flex items-center justify-center gap-4 p-2 bg-muted rounded-md mb-4 w-fit mx-auto mt-4">
            <Button
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              size="icon"
              variant="ghost"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium min-w-20 text-center">
              Page {currentPageIndex + 1} of {pages.length}
            </span>

            <Button
              onClick={handleNextPage}
              disabled={currentPageIndex === pages.length - 1}
              size="icon"
              variant="ghost"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }
);

InvoiceDocument.displayName = "InvoiceDocument";

export default InvoiceDocument;
