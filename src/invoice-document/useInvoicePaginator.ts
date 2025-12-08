import { useEffect, useState, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { InvoiceForm, InvoiceItem } from "../invoice-form/types";
import {
  TaxLabel,
  HeaderSection,
  InvoiceMeta,
  ReceiverSection,
  ItemsTableHeader,
  ItemsTableRow,
  TotalsTable,
  AmountWordsSection,
  FooterSection,
} from "./InvoiceTemplateComponents";

export type PageConfig = {
  startRow: number;
  endRow: number;
  showTotals: boolean;
  showWords: boolean;
  showFooter: boolean;
  continued: boolean;
  pageNumber: number;
  totalPages: number;
};

/**
 * Hybrid probe-based pagination.
 * We render invisible pages and test whether adding
 * the next element (row/totals/words/footer) overlaps
 * the bottom of the page.
 */
export function useInvoicePaginator(data: InvoiceForm) {
  const [pages, setPages] = useState<PageConfig[]>([]);
  const probeRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!probeRootRef.current) return;
    paginate();
  }, [data]);

  function paginate() {
    const root = probeRootRef.current!;
    root.innerHTML = ""; // Clear all previous probe pages

    let rowIndex = 0;
    const rows = data.items.length;
    const newPages: PageConfig[] = [];

    let needTotals = true;
    let needWords = true;
    let needFooter = true;

    while (rowIndex < rows || needTotals || needWords || needFooter) {
      // 1. Create a fresh probe page
      const probePage = document.createElement("div");
      probeRootRef.current!.appendChild(probePage);

      // Render the skeleton page (header+meta+receiver+table-header)
      const probe = renderProbePageSkeleton(probePage, data);

      // Convert DOM nodes for probing
      const tbody = probe.tbody;
      const pageBorder = probe.pageBorder;

      const bottomLimit = pageBorder.getBoundingClientRect().bottom;

      const startRow = rowIndex;
      let endRow = rowIndex;

      // =============== Fit Rows ===============
      while (endRow < rows) {
        const rowClone = renderProbeRow(data.items[endRow]);
        tbody.appendChild(rowClone);

        const rect = rowClone.getBoundingClientRect();
        if (rect.bottom > bottomLimit) {
          // Remove overflowing row
          tbody.removeChild(rowClone);
          break;
        }

        endRow++;
      }

      // =============== Fit Totals ===============
      let placeTotals = false;
      let placeWords = false;
      let placeFooter = false;

      if (needTotals) {
        const totalsClone = probe.totalsTemplate.cloneNode(true) as HTMLElement;
        probe.container.appendChild(totalsClone);

        if (totalsClone.getBoundingClientRect().bottom <= bottomLimit) {
          placeTotals = true;
          needTotals = false;
        } else {
          probe.container.removeChild(totalsClone);
        }
      }

      // =============== Fit Words ===============
      if (placeTotals && needWords) {
        const wordsClone = probe.wordsTemplate.cloneNode(true) as HTMLElement;
        probe.container.appendChild(wordsClone);

        if (wordsClone.getBoundingClientRect().bottom <= bottomLimit) {
          placeWords = true;
          needWords = false;
        } else {
          probe.container.removeChild(wordsClone);
        }
      }

      // =============== Fit Footer ===============
      if (placeTotals && placeWords && needFooter) {
        const footerClone = probe.footerTemplate.cloneNode(true) as HTMLElement;
        probe.container.appendChild(footerClone);

        if (footerClone.getBoundingClientRect().bottom <= bottomLimit) {
          placeFooter = true;
          needFooter = false;
        } else {
          probe.container.removeChild(footerClone);
        }
      }

      // Determine if continued
      const continued = endRow < rows || needTotals || needWords || needFooter;

      newPages.push({
        startRow,
        endRow,
        showTotals: placeTotals,
        showWords: placeWords,
        showFooter: placeFooter,
        continued,
        pageNumber: 0,
        totalPages: 0,
      });

      rowIndex = endRow;
    }

    // ADD THIS:
    newPages.forEach((page, i) => {
      page.pageNumber = i + 1;
      page.totalPages = newPages.length;
    });

    setPages(newPages);
  }

  return { pages, probeRootRef };
}

/* --------------------------------------------------
   PROBE HELPERS
-------------------------------------------------- */

// Render empty page with header + meta + buyer + table header
function renderProbePageSkeleton(container: HTMLElement, data: InvoiceForm) {
  // Use the same React components rendered to HTML
  const taxLabel = renderToStaticMarkup(TaxLabel());
  const headerSection = renderToStaticMarkup(HeaderSection({ data }));
  const invoiceMeta = renderToStaticMarkup(InvoiceMeta({ data }));
  const receiverSection = renderToStaticMarkup(ReceiverSection({ data }));
  const tableHeader = renderToStaticMarkup(ItemsTableHeader());

  const html = `
    <div class="invoice-page probe">
      <div class="invoice-border">
        ${taxLabel}
        ${headerSection}
        <hr class="divider" />
        ${invoiceMeta}
        <hr class="divider" />
        ${receiverSection}

        <table class="items-table">
          ${tableHeader}
          <tbody></tbody>
        </table>

        <div class="probe-container"></div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const tbody = container.querySelector(".items-table tbody")!;
  const totalsTemplate = createTotalsTemplate(data);
  const wordsTemplate = createWordsTemplate(data);
  const footerTemplate = createFooterTemplate(data);

  return {
    pageBorder: container.querySelector(".invoice-border") as HTMLElement,
    tbody,
    totalsTemplate,
    wordsTemplate,
    footerTemplate,
    container: container.querySelector(".probe-container") as HTMLElement,
  };
}

function renderProbeRow(item: InvoiceItem) {
  const tr = document.createElement("tr");
  tr.innerHTML = renderToStaticMarkup(ItemsTableRow({ item }));
  return tr;
}

/* Templates for totals / words / footer */

function createTotalsTemplate(data: InvoiceForm) {
  const wrap = document.createElement("div");
  wrap.innerHTML = renderToStaticMarkup(TotalsTable({ data }));
  return wrap.firstElementChild as HTMLElement;
}

function createWordsTemplate(data: InvoiceForm) {
  const wrap = document.createElement("div");
  wrap.innerHTML = renderToStaticMarkup(AmountWordsSection({ data }));
  return wrap.firstElementChild as HTMLElement;
}

function createFooterTemplate(data: InvoiceForm) {
  const wrap = document.createElement("div");
  wrap.innerHTML = renderToStaticMarkup(FooterSection({ data }));
  return wrap.firstElementChild as HTMLElement;
}
