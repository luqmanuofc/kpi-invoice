import { useEffect, useState, useRef } from "react";
import type { InvoiceForm, InvoiceItem } from "./InvoiceFormPage";

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

type Props = {
  data: InvoiceForm;
};

/**
 * Hybrid probe-based pagination.
 * We render invisible pages and test whether adding
 * the next element (row/totals/words/footer) overlaps
 * the bottom of the page.
 */
export function useInvoicePaginator({ data }: Props) {
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
  // Use actual InvoicePage component skeleton
  container.innerHTML = `
    <div class="invoice-page probe">
      <div class="invoice-border">
        <div class="tax-label">Tax Invoice</div>
        <div class="header-section">
          <div class="left">
            <h1 class="company-title">${data.sellerName}</h1>
            <div class="address">${data.sellerAddress}</div>
          </div>
          <div class="right">
            <div>Email: ${data.sellerEmail}</div>
            <div>Mobile: ${data.sellerPhone}</div>
            <div>GSTIN: ${data.sellerGstin}</div>
          </div>
        </div>
        <hr class="divider" />
        <div class="invoice-meta">
          <span>Invoice No: ${data.invoiceNumber}</span>
          <span class="center">Vehicle No: ${data.vehicleNumber}</span>
          <span class="right">Date: ${data.date}</span>
        </div>
        <hr class="divider" />
        <div class="receiver-section">
          <div class="receiver-title">Details of Receiver (Billed To)</div>
          <div class="receiver-field"><label>Name:</label><span>${data.buyerName}</span></div>
          <div class="receiver-field"><label>Address:</label><span>${data.buyerAddress}</span></div>
          <div class="receiver-field"><label>GSTIN No:</label><span>${data.buyerGstin}</span></div>
        </div>
        <hr class="divider" />
        
        <table class="items-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Description of Goods</th>
              <th>HSN Code</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

        <div class="probe-container"></div>
      </div>
    </div>
  `;

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
  const rate = Number(item.rate) || 0;
  const qty = Number(item.qty) || 0;
  const lineTotal = qty * rate;
  tr.innerHTML = `
    <td>?</td>
    <td>${item.description}</td>
    <td>${item.hsn}</td>
    <td>${qty}</td>
    <td>${item.unit}</td>
    <td>${rate.toFixed(2)}</td>
    <td>${lineTotal.toFixed(2)}</td>
  `;
  return tr;
}

/* Templates for totals / words / footer */

function createTotalsTemplate(data: InvoiceForm) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <table class="totals-table">
      <tbody>
        <tr><td>Sub Total</td><td class="amount">₹${data.subtotal.toFixed(
          2
        )}</td></tr>
        <tr><td>Discount</td><td class="amount">₹${data.discount.toFixed(
          2
        )}</td></tr>
        <tr><td>CGST @ ${
          data.cgst
        }%</td><td class="amount">₹${data.cgstAmount.toFixed(2)}</td></tr>
        <tr><td>SGST @ ${
          data.sgst
        }%</td><td class="amount">₹${data.sgstAmount.toFixed(2)}</td></tr>
        <tr><td>IGST @ ${
          data.igst
        }%</td><td class="amount">₹${data.igstAmount.toFixed(2)}</td></tr>
        <tr class="grand-total"><td>Total Invoice Value</td><td class="amount">₹${data.total.toFixed(
          2
        )}</td></tr>
      </tbody>
    </table>
  `;
  return wrap.firstElementChild as HTMLElement;
}

function createWordsTemplate(data: InvoiceForm) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="amount-words-section">
      <div class="dotted-line"></div>
      <div class="amount-text">Rs. <span class="amount-words">${data.amountInWords}</span></div>
      <div class="dotted-line"></div>
    </div>
  `;
  return wrap.firstElementChild as HTMLElement;
}

function createFooterTemplate(data: InvoiceForm) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="footer-section">
      <div className="terms">
              <strong>Terms & Conditions:</strong>
              <div>
                1. E. &amp; O.E.
                <br />
                2. Subject to Srinagar Jurisdiction.
                <br />
                3. Interest @ 24% p.a. if unpaid within 30 days.
                <br />
                4. Goods once sold cannot be taken back.
              </div>
      </div>
      <div class="signature-block">
        <div class="company-sign">For ${data.sellerName}</div>
        <div class="signature-spacer"></div>
        <div class="signature-labels"><div></div><span>Authorised Signatory</span></div>
      </div>
    </div>
  `;
  return wrap.firstElementChild as HTMLElement;
}
