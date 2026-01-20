import "dayjs/locale/en-gb";
import { useInvoice } from "../contexts/InvoiceProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import InvoiceFormStep1 from "./InvoiceFormStep1";
import InvoiceFormStep2 from "./InvoiceFormStep2";
import { Label } from "@/components/ui/label";
import { ArrowLeft, PlusIcon } from "lucide-react";
import InvoiceFormStep3 from "./InvoiceFormStep3";

export default function InvoiceForm() {
  const {
    handleCreateInvoice: onCreateInvoice,
    activeStep,
    setActiveStep,
    invoiceNumberExists,
    isCheckingInvoiceNumber,
    isCreatingInvoice,
    setShowProductsModal,
    form,
  } = useInvoice();

  const handleNext = () => {
    if (activeStep === 0) {
      const invoiceNumber = form.getValues("invoiceNumber");
      const buyer = form.getValues("buyer");

      let hasError = false;

      if (!invoiceNumber || invoiceNumber.trim() === "") {
        form.setError("invoiceNumber", {
          type: "manual",
          message: "Invoice number is required",
        });
        hasError = true;
      }

      if (!buyer) {
        form.setError("buyer", {
          type: "manual",
          message: "Buyer is required",
        });
        hasError = true;
      }

      if (!hasError && !invoiceNumberExists) {
        setActiveStep(1);
      }
    }
    if (activeStep === 1) {
      if (form.getValues("items").length === 0) {
        form.setError("items", {
          type: "manual",
          message: "At least one item is required",
        });
        return;
      }
      setActiveStep(2);
    }
  };

  return (
    <div className="flex h-full md:h-fit w-full items-center justify-center p-2 md:p-10">
      <Card className="max-w-sm w-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">Create Invoice</CardTitle>
          <div>
            {activeStep === 0 && (
              <Label className="text-muted-foreground p-0">
                1. Invoice & Buyer
              </Label>
            )}
            {activeStep === 1 && (
              <div className="flex gap-2 justify-between">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="h-6 gap-1 px-2 rounded-full border border-muted-foreground text-muted-foreground"
                    onClick={() => setActiveStep(0)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-xs">back</span>
                  </Button>
                  <Label className="text-muted-foreground p-0">2. Items</Label>
                </div>
                <Button
                  variant="ghost"
                  className="h-6 gap-1 px-2 rounded-full border border-muted-foreground text-muted-foreground"
                  onClick={() => setShowProductsModal(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="text-xs">Add Items</span>
                </Button>
              </div>
            )}
            {activeStep === 2 && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    className="h-6 gap-1 px-2 rounded-full border border-muted-foreground text-muted-foreground"
                    onClick={() => setActiveStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-xs">back</span>
                  </Button>
                  <div />
                </div>
                <Label className="text-muted-foreground p-0">
                  3. Taxes & Discounts
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {activeStep === 0 && <InvoiceFormStep1 />}
            {activeStep === 1 && <InvoiceFormStep2 />}
            {activeStep === 2 && <InvoiceFormStep3 />}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={activeStep === 2 ? onCreateInvoice : handleNext}
            disabled={isCheckingInvoiceNumber || isCreatingInvoice}
          >
            {activeStep === 2
              ? isCreatingInvoice
                ? "Creating Invoice..."
                : "Create Invoice"
              : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
