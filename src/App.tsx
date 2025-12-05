import "./App.css";
import InvoiceFormPage from "./InvoiceFormPage";
import InvoiceDocument from "./InvoiceDocument";
import type { InvoiceForm } from "./InvoiceFormPage";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { useMemo } from "react";
import { ToWords } from "to-words";
import { Button } from "@mui/material";

function App() {
  const form = useForm<InvoiceForm>({
    defaultValues: {
      invoiceNumber: "",
      vehicleNumber: "",
      date: dayjs().format("YYYY-MM-DD"),

      buyerName: "",
      buyerAddress: "",
      buyerGstin: "",

      items: [{ description: "", hsn: "", qty: 1, unit: "Kg", rate: 0 }],

      discount: 0,
      cgst: 9,
      sgst: 9,
      igst: 0,

      // Totals – initially 0, will be overwritten
      subtotal: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0,

      // Seller
      sellerName: "Khaldun Plastic Industries",
      sellerAddress: "28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR (J&K)",
      sellerEmail: "kpikashmir@gmail.com",
      sellerPhone: "9419009217",
      sellerGstin: "01BSGPB0427H1ZJ",

      amountInWords: "",
    },
  });

  // Watch form values for real-time updates
  const formData = form.watch();

  // Compute totals automatically whenever form data changes
  const computedData = useMemo(() => {
    const subtotal = formData.items.reduce((sum, i) => sum + i.qty * i.rate, 0);

    const cgstAmount = (subtotal * formData.cgst) / 100;
    const sgstAmount = (subtotal * formData.sgst) / 100;
    const igstAmount = (subtotal * formData.igst) / 100;

    const total =
      subtotal - formData.discount + cgstAmount + sgstAmount + igstAmount;

    const toWords = new ToWords({ localeCode: "en-IN" });
    const amountInWords =
      toWords.convert(Math.round(total)).toUpperCase() + " ONLY";

    return {
      ...formData,
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      total,
      amountInWords,
    };
  }, [formData]);

  return (
    <div
      style={{
        display: "flex",
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
        <InvoiceFormPage form={form} />
        <Button variant="contained">Generate PDF</Button>
      </div>

      <InvoiceDocument data={computedData} />
    </div>
  );
}

export default App;
