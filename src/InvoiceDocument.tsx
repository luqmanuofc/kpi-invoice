// InvoiceDocument.tsx
import "./InvoiceDocument.css";
import { forwardRef, useImperativeHandle } from "react";
import InvoicePage from "./InvoicePage";
import { useInvoicePaginator } from "./useInvoicePaginator";
import type { InvoiceForm } from "./InvoiceFormPage";

export type InvoiceDocumentHandle = {
  getPageElements: () => HTMLDivElement[];
};

type Props = {
  data: InvoiceForm;
};

const InvoiceDocument = forwardRef<InvoiceDocumentHandle, Props>(
  ({ data }, ref) => {
    const { pages, probeRootRef } = useInvoicePaginator({ data });

    let pageRefs: HTMLDivElement[] = [];

    useImperativeHandle(ref, () => ({
      getPageElements: () => pageRefs,
    }));

    return (
      <div className="invoice-page-wrapper">
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
                continued={p.continued}
                rowStartIndex={p.startRow}
              />
            </div>
          );
        })}
      </div>
    );
  }
);

InvoiceDocument.displayName = "InvoiceDocument";

export default InvoiceDocument;
