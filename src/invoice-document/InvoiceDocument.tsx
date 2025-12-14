// InvoiceDocument.tsx
import "./InvoiceDocument.css";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InvoicePage from "./InvoicePage";
import { useInvoicePaginator } from "./useInvoicePaginator";
import type { InvoiceForm } from "../invoice-form/types";

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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              padding: "8px 16px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              marginBottom: "16px",
              width: "fit-content",
              marginInline: "auto",
            }}
          >
            <IconButton
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              size="small"
            >
              <ChevronLeftIcon />
            </IconButton>

            <Typography
              variant="body2"
              sx={{ fontWeight: 500, minWidth: "80px", textAlign: "center" }}
            >
              Page {currentPageIndex + 1} of {pages.length}
            </Typography>

            <IconButton
              onClick={handleNextPage}
              disabled={currentPageIndex === pages.length - 1}
              size="small"
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}
      </div>
    );
  }
);

InvoiceDocument.displayName = "InvoiceDocument";

export default InvoiceDocument;
