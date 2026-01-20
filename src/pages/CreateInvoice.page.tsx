import InvoiceForm from "../invoice-form/InvoiceForm";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "../invoice-document/InvoiceDocument";
import { useInvoice } from "../contexts/InvoiceProvider";
import { useRef, useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

export default function CreateInvoicePage() {
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
    <div className="w-full flex-1 flex p-4 md:p-8">
      <div className="min-w-full md:min-w-125">
        <InvoiceForm />
      </div>
      <div className="hidden md:block">
        <InvoiceDocument
          ref={invoiceRef}
          data={debouncedData}
          transformOrigin="top left"
        />
      </div>
    </div>
  );
}
