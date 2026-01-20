import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import dayjs from "dayjs";
import { ToWords } from "to-words";
import type { InvoiceForm } from "../invoice-form/types";
import {
  createInvoice,
  getNextInvoiceNumber,
  type Invoice,
} from "../api/invoices";
import { useNavigate } from "react-router-dom";

type InvoiceContextType = {
  form: UseFormReturn<InvoiceForm, any, InvoiceForm>;
  computedData: InvoiceForm;
  handleCreateInvoice: () => void;
  duplicateInvoice: (invoice: Invoice) => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
  invoiceNumberExists: boolean;
  setInvoiceNumberExists: (exists: boolean) => void;
  isCheckingInvoiceNumber: boolean;
  setIsCheckingInvoiceNumber: (isChecking: boolean) => void;
  isCreatingInvoice: boolean;
  isFetchingNextInvoiceNumber: boolean;
  showProductsModal: boolean;
  setShowProductsModal: (show: boolean) => void;
  fetchAndSetNextInvoiceNumber: () => Promise<void>;
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [invoiceNumberExists, setInvoiceNumberExists] = useState(false);
  const [isCheckingInvoiceNumber, setIsCheckingInvoiceNumber] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isFetchingNextInvoiceNumber, setIsFetchingNextInvoiceNumber] =
    useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const navigate = useNavigate();

  const form = useForm<InvoiceForm>({
    defaultValues: {
      invoiceNumber: "",
      vehicleNumber: "",
      date: dayjs().format("YYYY-MM-DD"),

      buyer: null,

      sellerName: "Khaldun Plastic Industries",
      sellerAddress: "28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR (J&K)",
      sellerEmail: "kpikashmir@gmail.com",
      sellerPhone: "9419009217",
      sellerGstin: "01BSGPB0427H1ZJ",

      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,

      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,

      discount: 0,
      subtotal: 0,
      total: 0,
      amountInWords: "",

      items: [],
    },
  });

  const fetchAndSetNextInvoiceNumber = async () => {
    setIsFetchingNextInvoiceNumber(true);
    try {
      const result = await getNextInvoiceNumber("2025-26/");
      form.setValue("invoiceNumber", result.nextInvoiceNumber);
    } catch (err) {
      console.error("Failed to fetch next invoice number:", err);
    } finally {
      setIsFetchingNextInvoiceNumber(false);
    }
  };

  // Fetch and populate next invoice number on mount
  useEffect(() => {
    // Only fetch if user is authenticated
    const token = localStorage.getItem("authToken");
    if (token) {
      fetchAndSetNextInvoiceNumber();
    }
  }, [form]);

  const formData = form.watch();

  const computedData = useMemo<InvoiceForm>(() => {
    const subtotal = formData.items.reduce((sum, i) => sum + i.qty * i.rate, 0);

    const cgstAmount = (subtotal * formData.cgstRate) / 100;
    const sgstAmount = (subtotal * formData.sgstRate) / 100;
    const igstAmount = (subtotal * formData.igstRate) / 100;

    const computedTotal =
      subtotal - formData.discount + cgstAmount + sgstAmount + igstAmount;

    const total = Math.round(computedTotal);
    const roundOffAmount = total - computedTotal;

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
      roundOffAmount,
      total,
      amountInWords,
    };
  }, [formData]);

  const handleCreateInvoice = async () => {
    setIsCreatingInvoice(true);
    try {
      const result = await createInvoice(computedData);
      console.log("Invoice created:", result);
      setActiveStep(0);
      form.reset();
      fetchAndSetNextInvoiceNumber();
      navigate(`/invoice/${result.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create invoice.");
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const duplicateInvoice = (invoice: Invoice) => {
    // Convert Invoice to InvoiceForm
    const invoiceFormData: InvoiceForm = {
      // Let invoiceNumber auto-generate (will be set by the useEffect)
      id: "",
      invoiceNumber: "",
      vehicleNumber: invoice.vehicleNumber,
      date: dayjs().format("YYYY-MM-DD"), // Use today's date for the duplicate

      // Reconstruct buyer object from snapshot data
      buyer: {
        id: invoice.buyerId,
        name: invoice.buyerNameSnapshot,
        address: invoice.buyerAddressSnapshot,
        gstin: invoice.buyerGstinSnapshot,
        phone: invoice.buyerPhoneSnapshot,
        createdAt: "", // Not needed for form
        updatedAt: "", // Not needed for form
      },

      // Copy items (without id and position as they're DB-specific)
      items:
        invoice.items?.map((item) => ({
          productId: item.productId,
          description: item.description,
          hsn: item.hsn,
          qty: item.qty,
          unit: item.unit,
          rate: item.rate,
          lineTotal: item.lineTotal,
        })) || [],

      // Copy discount and tax rates (amounts will be auto-calculated)
      discount: invoice.discount,
      cgstRate: invoice.cgstRate,
      sgstRate: invoice.sgstRate,
      igstRate: invoice.igstRate,

      // These will be auto-calculated by computedData
      subtotal: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0,
      roundOffAmount: 0,
      amountInWords: "",

      // Copy seller info from snapshot
      sellerName: invoice.sellerNameSnapshot,
      sellerAddress: invoice.sellerAddressSnapshot,
      sellerEmail: invoice.sellerEmailSnapshot,
      sellerPhone: invoice.sellerPhoneSnapshot,
      sellerGstin: invoice.sellerGstinSnapshot,
    };

    // Reset the form with the duplicated data
    form.reset(invoiceFormData);

    // Fetch and set the next invoice number
    fetchAndSetNextInvoiceNumber();

    // Reset to first step
    setActiveStep(0);

    // Navigate to create invoice page
    navigate("/");
  };

  return (
    <InvoiceContext.Provider
      value={{
        form,
        computedData,
        handleCreateInvoice,
        duplicateInvoice,
        activeStep,
        setActiveStep,
        invoiceNumberExists,
        setInvoiceNumberExists,
        isCheckingInvoiceNumber,
        setIsCheckingInvoiceNumber,
        isCreatingInvoice,
        fetchAndSetNextInvoiceNumber,
        isFetchingNextInvoiceNumber,
        showProductsModal,
        setShowProductsModal,
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
