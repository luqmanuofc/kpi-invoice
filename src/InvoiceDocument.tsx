// InvoiceDocument.tsx
import "./InvoiceDocument.css";

export default function InvoiceDocument() {
  return (
    <div className="invoice-page">
      {/* Outer border */}
      <div className="invoice-border">
        {/* Tax Label */}
        <div className="tax-label">Tax Invoice</div>

        {/* Header Section */}
        <div className="header-section">
          <div className="left">
            <h1 className="company-title">Khaldun Plastic Industries</h1>
            <div className="address">
              28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR (J&amp;K)
            </div>
          </div>

          <div className="right">
            <div>Email: kpikashmir@gmail.com</div>
            <div>Mobile: 9419009217</div>
            <div>GSTIN: 01BSGPB0427H1ZJ</div>
          </div>
        </div>

        <hr className="divider" />

        {/* Invoice Info */}
        <div className="invoice-meta">
          <span>Invoice No: INV-001</span>
          <span className="center">Vehicle No: TR-1234</span>
          <span className="right">Date: 27/09/2025</span>
        </div>

        <hr className="divider" />

        {/* === Details of Receiver (Billed To) === */}
        <div className="receiver-section">
          <div className="receiver-title">Details of Receiver (Billed To)</div>

          <div className="receiver-field">
            <label>Name:</label>
            <span>John Doe Enterprises</span>
          </div>

          <div className="receiver-field">
            <label>Address:</label>
            <span>123 Industrial Road, Srinagar, J&amp;K</span>
          </div>

          <div className="receiver-field">
            <label>GSTIN No:</label>
            <span>22ABCDE1234F1Z9</span>
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
            <tr>
              <td>1</td>
              <td>Plastic Packaging Bags</td>
              <td>3923</td>
              <td>50</td>
              <td>Kg</td>
              <td>120.00</td>
              <td>6000.00</td>
            </tr>

            <tr>
              <td>2</td>
              <td>Industrial Polythene Roll</td>
              <td>3920</td>
              <td>20</td>
              <td>Kg</td>
              <td>140.00</td>
              <td>2800.00</td>
            </tr>

            <tr>
              <td>3</td>
              <td>Custom Printed Carry Bags</td>
              <td>3926</td>
              <td>1000</td>
              <td>Pcs</td>
              <td>2.50</td>
              <td>2500.00</td>
            </tr>
          </tbody>
        </table>
        {/* === Totals Table (Right-Aligned) === */}
        <table className="totals-table">
          <tbody>
            <tr>
              <td>Sub Total</td>
              <td className="amount">12,150.00</td>
            </tr>
            <tr>
              <td>Discount</td>
              <td className="amount">0.00</td>
            </tr>
            <tr>
              <td>CGST @ 9%</td>
              <td className="amount">1,093.50</td>
            </tr>
            <tr>
              <td>SGST @ 9%</td>
              <td className="amount">1,093.50</td>
            </tr>
            <tr>
              <td>IGST @ 0%</td>
              <td className="amount">0.00</td>
            </tr>

            <tr className="grand-total">
              <td>Total Invoice Value</td>
              <td className="amount">14,337.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
