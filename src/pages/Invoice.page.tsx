import InvoiceFormPage from "../invoice-form/InvoiceFormPage";
import InvoiceDocument, {
  type InvoiceDocumentHandle,
} from "../invoice-document/InvoiceDocument";
import { useInvoice } from "../contexts/InvoiceProvider";
import { useRef, useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { Box } from "@mui/material";

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
    <Box
      sx={{
        display: "flex",
        margin: 0,
        padding: "1rem",
        gap: "1rem",
        flexDirection: "row",
        justifyContent: { xs: "center", md: "inherit" },
      }}
    >
      <Box className="invoice-input-form-wrapper">
        <InvoiceFormPage />
      </Box>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <InvoiceDocument data={debouncedData} ref={invoiceRef} />
      </Box>
    </Box>
  );
}
