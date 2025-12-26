// Shared invoice template components used in both rendering and pagination
import type { InvoiceForm, InvoiceItem } from "../invoice-form/types";

export function TaxLabel() {
  return <div className="tax-label">Tax Invoice</div>;
}

export function HeaderSection({ data }: { data: InvoiceForm }) {
  return (
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
  );
}

export function InvoiceMeta({ data }: { data: InvoiceForm }) {
  return (
    <div className="invoice-meta">
      <span>Invoice No: {data.invoiceNumber}</span>
      {data.vehicleNumber && (
        <span className="center">Vehicle No: {data.vehicleNumber}</span>
      )}
      <span className="right">Date: {data.date}</span>
    </div>
  );
}

export function ReceiverSection({ data }: { data: InvoiceForm }) {
  return (
    <>
      <div className="receiver-section">
        <div className="receiver-title">Buyer Details</div>

        <div className="receiver-field">
          <label>Name:</label>
          <span>{data.buyer?.name}</span>
        </div>

        <div className="receiver-field">
          <label>Address:</label>
          <span className="preserve-newlines">{data.buyer?.address}</span>
        </div>

        <div className="receiver-field">
          <label>Phone:</label>
          <span>{data?.buyer?.phone}</span>
        </div>

        <div className="receiver-field">
          <label>GSTIN No:</label>
          <span>{data?.buyer?.gstin}</span>
        </div>
      </div>

      <hr className="divider" />
    </>
  );
}

export function ItemsTableHeader() {
  return (
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
  );
}

export function ItemsTableRow({
  item,
  serial,
}: {
  item: InvoiceItem;
  serial?: number;
}) {
  const rate = Number(item.rate) || 0;
  const qty = Number(item.qty) || 0;
  const total = qty * rate;

  return (
    <tr>
      <td>{serial ?? "?"}</td>
      <td>{item.description}</td>
      <td>{item.hsn}</td>
      <td>{qty}</td>
      <td>{item.unit}</td>
      <td>{rate.toFixed(2)}</td>
      <td>{total.toFixed(2)}</td>
    </tr>
  );
}

export function TotalsTable({ data }: { data: InvoiceForm }) {
  return (
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
          <td>CGST @ {data.cgstRate}%</td>
          <td className="amount">₹{data.cgstAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>SGST @ {data.sgstRate}%</td>
          <td className="amount">₹{data.sgstAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>IGST @ {data.igstRate}%</td>
          <td className="amount">₹{data.igstAmount.toFixed(2)}</td>
        </tr>
        <tr className="grand-total">
          <td>Total Invoice Value</td>
          <td className="amount">₹{data.total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export function AmountWordsSection({ data }: { data: InvoiceForm }) {
  return (
    <div className="amount-words-section">
      <div className="dotted-line" />
      <div className="amount-text">
        Rs. <span className="amount-words">{data.amountInWords}</span>
      </div>
      <div className="dotted-line" />
    </div>
  );
}

export function FooterSection({ data }: { data: InvoiceForm }) {
  return (
    <div>
      <div className="footer-section">
        <div className="terms">
          <strong>Terms & Conditions:</strong>
          <div>
            1. E. &amp; O.E.
            <br />
            2. Subject to Srinagar Jurisdiction.
            <br />
            3. Interest @ 18% p.a. if unpaid within 30 days.
            <br />
            4. Goods once sold cannot be taken back.
            <br />
            5. Our responsibility ceases once goods leave our premises.
          </div>
        </div>

        <div className="signature-block">
          <div className="company-sign">For {data.sellerName}</div>
          <div className="signature-spacer">
            Digitally signed by Nasir Bukhari
            <br />
            Digital Id: {data.id}
          </div>
          <div className="signature-labels">
            <div />
            Authorised Signatory
          </div>
        </div>
      </div>
      <div>
        <div className="payment-info-section">
          <div className="payment-header">Payment Information</div>
          <div className="payment-accounts">
            <div className="payment-account">
              <div className="payment-line">
                1.<span style={{ fontWeight: "bold" }}> Bank: </span> JK Bank,
                Zainakot
                <span style={{ fontWeight: "bold" }}> Account no: </span>
                0258020100000059
                <span style={{ fontWeight: "bold" }}> IFSC:</span> JAKA0ZANKOT
              </div>
            </div>
            <div className="payment-account">
              <div className="payment-line">
                2.<span style={{ fontWeight: "bold" }}> Bank: </span> HDFC Bank,
                Malru
                <span style={{ fontWeight: "bold" }}> Account no: </span>
                50200098216650
                <span style={{ fontWeight: "bold" }}> IFSC:</span> HDFC0003580
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
