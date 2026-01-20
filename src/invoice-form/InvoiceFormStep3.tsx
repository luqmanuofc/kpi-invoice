import { Controller } from "react-hook-form";
import { useInvoice } from "../contexts/InvoiceProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InvoiceFormStep3() {
  const { form, computedData } = useInvoice();
  const { control } = form;

  const subtotal = Number(computedData.subtotal) || 0;
  const discount = Number(computedData.discount) || 0;
  const cgstAmount = Number(computedData.cgstAmount) || 0;
  const sgstAmount = Number(computedData.sgstAmount) || 0;
  const igstAmount = Number(computedData.igstAmount) || 0;
  const total = Number(computedData.total) || 0;
  const roundOffAmount = Number(computedData.roundOffAmount) || 0;

  return (
    <>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="discount">Discount (₹)</Label>
        </div>
        <Controller
          name="discount"
          control={control}
          render={({ field }) => (
            <Input
              id="discount"
              type="number"
              {...field}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          )}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="cgstRate">CGST (%)</Label>
        </div>
        <Controller
          name="cgstRate"
          control={control}
          render={({ field }) => (
            <Input
              id="cgstRate"
              type="number"
              {...field}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          )}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="sgstRate">SGST (%)</Label>
        </div>
        <Controller
          name="sgstRate"
          control={control}
          render={({ field }) => (
            <Input
              id="sgstRate"
              type="number"
              {...field}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          )}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="igstRate">IGST (%)</Label>
        </div>
        <Controller
          name="igstRate"
          control={control}
          render={({ field }) => (
            <Input
              id="igstRate"
              type="number"
              {...field}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          )}
        />
      </div>

      <div className="mt-3 p-3 bg-muted rounded-md">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Sub Total</span>
            <span className="text-sm text-muted-foreground">
              ₹
              {subtotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Discount</span>
            <span className="text-sm text-muted-foreground">
              ₹
              {discount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              CGST @ {computedData.cgstRate}%
            </span>
            <span className="text-sm text-muted-foreground">
              ₹
              {cgstAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              SGST @ {computedData.sgstRate}%
            </span>
            <span className="text-sm text-muted-foreground">
              ₹
              {sgstAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              IGST @ {computedData.igstRate}%
            </span>
            <span className="text-sm text-muted-foreground">
              ₹
              {igstAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Round Off</span>
            <span className="text-sm text-muted-foreground">
              ₹
              {roundOffAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-sm font-medium">Total Invoice Value</span>
            <span className="text-sm font-medium">
              ₹
              {total.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
