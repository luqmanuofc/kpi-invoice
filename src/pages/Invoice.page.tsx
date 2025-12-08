import InvoiceFormPage from "../invoice-form/InvoiceFormPage";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "../invoice-document/InvoiceDocument";
import { useInvoice } from "../contexts/InvoiceProvider";
import { useRef } from "react";

export default function InvoicePage() {
  const { computedData } = useInvoice();
  const invoiceRef = useRef<InvoiceDocumentHandle | null>(null);

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
