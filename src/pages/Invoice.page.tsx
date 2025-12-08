import InvoiceFormPage from "../invoice-form/InvoiceFormPage";
import InvoiceDocument from "../invoice-document/InvoiceDocument";
import { useInvoice } from "../contexts/InvoiceProvider";

export default function InvoicePage() {
  const { invoiceRef, computedData } = useInvoice();
  return (
    <div
      style={{
        display: "flex",
        padding: "1rem",
        gap: "1rem",
        flexDirection: "row",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: "1rem",
        }}
      >
        <InvoiceFormPage />
      </div>

      <InvoiceDocument data={computedData} ref={invoiceRef} />
    </div>
  );
}
