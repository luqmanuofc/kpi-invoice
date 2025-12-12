import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import dayjs from "dayjs";
import { ToWords } from "to-words";
import type { InvoiceForm } from "../invoice-form/types";
import { createInvoice } from "../api/invoices";
import { useNavigate } from "react-router-dom";

type InvoiceContextType = {
  form: UseFormReturn<InvoiceForm, any, InvoiceForm>;
  computedData: InvoiceForm;
  handleCreateInvoice: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const navigate = useNavigate();

  const form = useForm<InvoiceForm>({
    defaultValues: {
      invoiceNumber: "",
      vehicleNumber: "",
      date: dayjs().format("YYYY-MM-DD"),

      buyer: null,

      items: [],

      discount: 0,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,

      subtotal: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0,

      sellerName: "Khaldun Plastic Industries",
      sellerAddress: "28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR (J&K)",
      sellerEmail: "kpikashmir@gmail.com",
      sellerPhone: "9419009217",
      sellerGstin: "01BSGPB0427H1ZJ",

      amountInWords: "",
    },
  });

  const formData = form.watch();

  const computedData = useMemo<InvoiceForm>(() => {
    const subtotal = formData.items.reduce((sum, i) => sum + i.qty * i.rate, 0);

    const cgstAmount = (subtotal * formData.cgstRate) / 100;
    const sgstAmount = (subtotal * formData.sgstRate) / 100;
    const igstAmount = (subtotal * formData.igstRate) / 100;

    const computedTotal =
      subtotal - formData.discount + cgstAmount + sgstAmount + igstAmount;

    const total = Math.round(computedTotal);

    const toWords = new ToWords({ localeCode: "en-IN" });
    const amountInWords = toWords.convert(total).toUpperCase() + " ONLY";

    // Compute lineTotals for items
    const itemsWithLineTotals = formData.items.map((item) => ({
      ...item,
      lineTotal: item.qty * item.rate,
    }));

    return {
      ...formData,
      items: itemsWithLineTotals,
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      total,
      amountInWords,
    };
  }, [formData]);

  const handleCreateInvoice = async () => {
    try {
      // Map form data to API payload (includes seller config)
      const payload = mapInvoiceFormToPayload(computedData);
      const result = await createInvoice(payload);
      console.log("Invoice created:", result);
      setActiveStep(0);
      form.reset();
      navigate(`/invoice/${result.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create invoice.");
    }
  };

  return (
    <InvoiceContext.Provider
      value={{
        form,
        computedData,
        handleCreateInvoice,
        activeStep,
        setActiveStep,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error("useInvoice must be used within an InvoiceProvider");
  }
  return context;
}
