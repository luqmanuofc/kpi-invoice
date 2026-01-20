import { Controller } from "react-hook-form";
import dayjs from "dayjs";
import { useInvoice } from "../contexts/InvoiceProvider";
import { useEffect, useCallback, useState } from "react";
import { checkInvoiceNumber } from "../api/invoices";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BuyerSelect } from "./BuyerSelect";

export default function InvoiceFormStep1() {
  const {
    form,
    invoiceNumberExists,
    setInvoiceNumberExists,
    isCheckingInvoiceNumber,
    setIsCheckingInvoiceNumber,
    isFetchingNextInvoiceNumber,
  } = useInvoice();
  const { control, watch } = form;
  const invoiceNumber = watch("invoiceNumber");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Debounced invoice number validation
  const debouncedCheckInvoiceNumber = useCallback(
    debounce(async (invoiceNumberValue: string) => {
      if (!invoiceNumberValue || invoiceNumberValue.trim() === "") {
        setInvoiceNumberExists(false);
        setIsCheckingInvoiceNumber(false);
        return;
      }

      try {
        const result = await checkInvoiceNumber(invoiceNumberValue);
        setInvoiceNumberExists(result.exists);
      } catch (err) {
        console.error("Failed to check invoice number:", err);
      } finally {
        setIsCheckingInvoiceNumber(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (!invoiceNumber || invoiceNumber.trim() === "") {
      setInvoiceNumberExists(false);
      setIsCheckingInvoiceNumber(false);
      return;
    }

    setIsCheckingInvoiceNumber(true);
    debouncedCheckInvoiceNumber(invoiceNumber);

    return () => {
      debouncedCheckInvoiceNumber.cancel();
    };
  }, [invoiceNumber, debouncedCheckInvoiceNumber]);
  return (
    <>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
        </div>
        <Controller
          name="invoiceNumber"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <div className="relative">
              <div className="relative">
                <Input
                  id="invoiceNumber"
                  type="text"
                  {...field}
                  disabled={isFetchingNextInvoiceNumber}
                  onChange={(e) => {
                    field.onChange(e);
                    if (error) {
                      form.clearErrors("invoiceNumber");
                    }
                  }}
                  className={`pr-10 ${
                    invoiceNumberExists || error ? "border-red-500" : ""
                  }`}
                />
                {isCheckingInvoiceNumber && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {(error?.message || invoiceNumberExists) && (
                <p className="text-sm text-red-500 mt-1 text-left">
                  {error?.message || "This invoice number is already in use"}
                </p>
              )}
            </div>
          )}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="vehicleNumber">Vehicle Number</Label>
        </div>
        <Controller
          name="vehicleNumber"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Input
                id="vehicleNumber"
                type="text"
                {...field}
                className="pr-10"
              />
            </div>
          )}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="date">Invoice Date</Label>
        </div>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date"
                  className={cn(
                    "w-full justify-between font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value
                    ? dayjs(field.value).format("MMMM D, YYYY")
                    : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={
                    field.value
                      ? new Date(field.value + "T00:00:00")
                      : undefined
                  }
                  captionLayout="label"
                  onSelect={(date) => {
                    field.onChange(
                      date ? dayjs(date).format("YYYY-MM-DD") : ""
                    );
                    setDatePickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="buyer">Buyer</Label>
        </div>
        <Controller
          name="buyer"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <BuyerSelect
              value={field.value ?? null}
              onChange={(value) => {
                field.onChange(value);
                if (error) {
                  form.clearErrors("buyer");
                }
              }}
              onClear={() => {
                field.onChange(null);
                if (error) {
                  form.clearErrors("buyer");
                }
              }}
              error={error?.message}
            />
          )}
        />
      </div>
    </>
  );
}
