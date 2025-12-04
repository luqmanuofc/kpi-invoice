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
          <span className="center">Transport No: TR-1234</span>
          <span className="right">Date: 27/09/2025</span>
        </div>

        <hr className="divider" />
      </div>
    </div>
  );
}
