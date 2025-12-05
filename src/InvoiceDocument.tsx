import "./InvoiceDocument.css";
import type { InvoiceForm } from "./InvoiceFormPage"; // adjust path if needed

type Props = {
  data: InvoiceForm;
};

export default function InvoiceDocument({ data }: Props) {
  return (
    <div className="invoice-page">
      {/* Outer border */}
      <div className="invoice-border">
        {/* Tax Label */}
        <div className="tax-label">Tax Invoice</div>

        {/* Header Section */}
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

        {/* Invoice Info */}
        <div className="invoice-meta">
          <span>Invoice No: {data.invoiceNumber}</span>
          <span className="center">Vehicle No: {data.vehicleNumber}</span>
          <span className="right">Date: {data.date}</span>
        </div>

        <hr className="divider" />

        {/* === Details of Receiver (Billed To) === */}
        <div className="receiver-section">
          <div className="receiver-title">Details of Receiver (Billed To)</div>

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

        {/* === Items Table === */}
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
            {data.items.map((item, index) => {
              const lineTotal = item.qty * item.rate;

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.description}</td>
                  <td>{item.hsn}</td>
                  <td>{item.qty}</td>
                  <td>{item.unit}</td>
                  <td>₹{item.rate.toFixed(2)}</td>
                  <td>₹{lineTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* === Totals Table (Right-Aligned) === */}
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

        {/* === Amount in Words Section === */}
        <div className="amount-words-section">
          <div className="dotted-line"></div>

          <div className="amount-text">
            Rs. <span className="amount-words">{data.amountInWords}</span>
          </div>

          <div className="dotted-line"></div>
        </div>

        {/* === Footer Section (T&C + Signature) === */}
        <div className="footer-section">
          {/* Left: Terms & Conditions */}
          <div className="terms">
            <strong>Terms & Conditions:</strong>
            <ol className="terms-list">
              <li>E. &amp; O.E.</li>
              <li>Subject to Srinagar Jurisdiction.</li>
              <li>
                Interest @ 24% per annum will be charged if the bill is not paid
                within 30 days.
              </li>
              <li>Goods once sold cannot be taken back.</li>
            </ol>
          </div>

          {/* Right: Signature Block */}
          <div className="signature-block">
            <div className="company-sign">For {data.sellerName}</div>

            <div className="signature-spacer"></div>

            <div className="signature-labels">
              <div />
              <span>Authorised Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
