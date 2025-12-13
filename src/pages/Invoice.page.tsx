import InvoiceFormPage from "../invoice-form/InvoiceFormPage";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "../invoice-document/InvoiceDocument";
import { useInvoice } from "../contexts/InvoiceProvider";
import { useRef, useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

export default function InvoicePage() {
  const { computedData } = useInvoice();
  const invoiceRef = useRef<InvoiceDocumentHandle | null>(null);
  const [debouncedData, setDebouncedData] = useState(computedData);

  // Debounce computedData updates to prevent constant PDF re-renders
  const updateDebouncedData = useCallback(
    debounce((data: typeof computedData) => {
      setDebouncedData(data);
    }, 500),
    []
  );

  useEffect(() => {
    updateDebouncedData(computedData);

    return () => {
      updateDebouncedData.cancel();
    };
  }, [computedData, updateDebouncedData]);

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

      <InvoiceDocument data={debouncedData} ref={invoiceRef} />
    </div>
  );
}
