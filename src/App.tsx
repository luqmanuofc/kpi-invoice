// App.tsx
import "./App.css";
import InvoiceFormPage from "./invoice-form/InvoiceFormPage";
import InvoiceDocument from "./invoice-document/InvoiceDocument";
import { useInvoice } from "./contexts/InvoiceProvider";

function App() {
  const { invoiceRef } = useInvoice();
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
        {/* <Button variant="contained" onClick={handleGeneratePDF}>
          Generate PDF
        </Button> */}
      </div>

      <InvoiceDocument ref={invoiceRef} />
    </div>
  );
}

export default App;
