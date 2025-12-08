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

      items: [{ description: "", hsn: "", qty: 1, unit: "Kg", rate: 0 }],

      discount: 0,
      cgst: 9,
      sgst: 9,
      igst: 0,

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

  const handleCreateInvoice = async () => {
    try {
      const result = await createInvoice(computedData);
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
