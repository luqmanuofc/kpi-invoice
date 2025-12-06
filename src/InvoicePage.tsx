// InvoicePage.tsx
import type { InvoiceForm } from "./InvoiceFormPage";

type Props = {
  data: InvoiceForm;
  items: InvoiceForm["items"];
  showTotals: boolean;
  showWords: boolean;
  showFooter: boolean;
  rowStartIndex: number;
  isFirstPage: boolean;
  pageNumber: number;
  totalPages: number;
};

export default function InvoicePage({
  data,
  items,
  showTotals,
  showWords,
  showFooter,
  rowStartIndex,
  isFirstPage,
  pageNumber,
  totalPages,
}: Props) {
  return (
    <div className="invoice-page">
      <div className="invoice-border">
        {/* Always repeated */}
        <div className="tax-label">Tax Invoice</div>

        {/* Always repeated */}
        <div className="header-section">
          <div className="left">
            <h1 className="company-title">{data.sellerName}</h1>
            <div className="address">{data.sellerAddress}</div>
          </div>

          <div className="right">
            <div>Email: {data.sellerEmail}</div>
            <div>Mobile: {data.sellerPhone}</div>
            <div>GSTIN: {data.sellerGstin}</div>
          </div>
        </div>

        <hr className="divider" />

        {/* Always repeated */}
        <div className="invoice-meta">
          <span>Invoice No: {data.invoiceNumber}</span>
          <span className="center">Vehicle No: {data.vehicleNumber}</span>
          <span className="right">Date: {data.date}</span>
        </div>

        <hr className="divider" />

        {/* Buyer details ONLY on page 1 */}
        {isFirstPage && (
          <>
            <div className="receiver-section">
              <div className="receiver-title">
                Details of Receiver (Billed To)
              </div>

              <div className="receiver-field">
                <label>Name:</label>
                <span>{data.buyerName}</span>
              </div>

              <div className="receiver-field">
                <label>Address:</label>
                <span>{data.buyerAddress}</span>
              </div>

              <div className="receiver-field">
                <label>GSTIN No:</label>
                <span>{data.buyerGstin}</span>
              </div>
            </div>

            <hr className="divider" />
          </>
        )}

        {(items.length > 0 || isFirstPage) && (
          <table className="items-table">
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

            <tbody>
              {items.map((item, idx) => {
                const serial = rowStartIndex + idx + 1;
                const total = item.qty * item.rate;

                return (
                  <tr key={idx}>
                    <td>{serial}</td>
                    <td>{item.description}</td>
                    <td>{item.hsn}</td>
                    <td>{item.qty}</td>
                    <td>{item.unit}</td>
                    <td>{item.rate.toFixed(2)}</td>
                    <td>{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {showTotals && (
          <>
            <table className="totals-table">
              <tbody>
                <tr>
                  <td>Sub Total</td>
                  <td className="amount">₹{data.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Discount</td>
                  <td className="amount">₹{data.discount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>CGST @ {data.cgst}%</td>
                  <td className="amount">₹{data.cgstAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>SGST @ {data.sgst}%</td>
                  <td className="amount">₹{data.sgstAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>IGST @ {data.igst}%</td>
                  <td className="amount">₹{data.igstAmount.toFixed(2)}</td>
                </tr>
                <tr className="grand-total">
                  <td>Total Invoice Value</td>
                  <td className="amount">₹{data.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div className="clear-float"></div>
          </>
        )}

        {showWords && (
          <div className="amount-words-section">
            <div className="dotted-line" />
            <div className="amount-text">
              Rs. <span className="amount-words">{data.amountInWords}</span>
            </div>
            <div className="dotted-line" />
          </div>
        )}

        {showFooter && (
          <div className="footer-section">
            <div className="terms">
              <strong>Terms & Conditions:</strong>
              <ol className="terms-list">
                <li>E. &amp; O.E.</li>
                <li>Subject to Srinagar Jurisdiction.</li>
                <li>Interest @ 24% p.a. if unpaid within 30 days.</li>
                <li>Goods once sold cannot be taken back.</li>
              </ol>
            </div>

            <div className="signature-block">
              <div className="company-sign">For {data.sellerName}</div>
              <div className="signature-spacer"></div>
              <div className="signature-labels">
                <div />
                Authorised Signatory
              </div>
            </div>
          </div>
        )}

        <div className="page-number-label">
          Page {pageNumber} of {totalPages}
        </div>
      </div>
    </div>
  );
}
