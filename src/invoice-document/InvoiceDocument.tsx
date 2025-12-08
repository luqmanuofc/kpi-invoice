// InvoiceDocument.tsx
import "./InvoiceDocument.css";
import { forwardRef, useImperativeHandle } from "react";
import InvoicePage from "./InvoicePage";
import { useInvoicePaginator } from "./useInvoicePaginator";
import type { InvoiceForm } from "../invoice-form/types";

export type InvoiceDocumentHandle = {
  getPageElements: () => HTMLDivElement[];
};

type Props = {
  data: InvoiceForm;
};

const InvoiceDocument = forwardRef<InvoiceDocumentHandle, Props>(
  ({ data }, ref) => {
    const { pages, probeRootRef } = useInvoicePaginator(data);

    let pageRefs: HTMLDivElement[] = [];

    useImperativeHandle(ref, () => ({
      getPageElements: () => pageRefs,
    }));

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
          {/* Visible paginated pages */}
          {pages.map((p, idx) => {
            const items = data.items.slice(p.startRow, p.endRow);
            return (
              <div
                key={idx}
                ref={(el) => {
                  if (el) pageRefs[idx] = el;
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
      </div>
    );
  }
);

InvoiceDocument.displayName = "InvoiceDocument";

export default InvoiceDocument;
