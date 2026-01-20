import { Controller, useFieldArray } from "react-hook-form";
import { useInvoice } from "../contexts/InvoiceProvider";
import type { Product } from "../api/products";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddProductsModal from "./AddProductsModal";

export default function InvoiceFormStep2() {
  const { form, showProductsModal, setShowProductsModal } = useInvoice();
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (fields.length === 0) {
      setShowProductsModal(true);
    }
  }, [fields.length]);

  const handleAddProducts = (products: Product[]) => {
    // Batch append all products at once to trigger only one re-render
    const newItems = products.map((product) => ({
      productId: product.id,
      description: product.name,
      hsn: product.hsn,
      qty: 1,
      unit: product.defaultUnit,
      rate: product.defaultPrice,
      lineTotal: product.defaultPrice,
    }));

    append(newItems);

    // Prevent autofocus after adding items
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  return (
    <>
      <>
        {fields.length === 0 && (
          <Label className="text-destructive text-center w-full">
            Add items to continue
          </Label>
        )}

        {fields.map((item, index) => (
          <Card>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-2 justify-between">
                <Label className="font-bold">
                  {index + 1}. {form.getValues("items")[index].description}
                </Label>
                <Button
                  onClick={() => remove(index)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full border bg-background"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <Label>Quantity</Label>
                  </div>
                  <Controller
                    name={`items.${index}.qty`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus={false}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow digits
                          if (value === "" || /^[0-9]+$/.test(value)) {
                            field.onChange(value === "" ? "" : Number(value));
                          }
                        }}
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <Label>Unit</Label>
                  </div>
                  <Controller
                    name={`items.${index}.unit`}
                    control={control}
                    render={({ field }) => <Input type="text" {...field} />}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Label>Rate</Label>
                </div>
                <Controller
                  name={`items.${index}.rate`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string, digits, and decimal point during input
                        if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
                          field.onChange(value === "" ? "" : value);
                        }
                      }}
                      onBlur={(e) => {
                        // Convert to number on blur
                        const value = e.target.value;
                        field.onChange(value === "" ? "" : Number(value));
                        field.onBlur();
                      }}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </>

      <AddProductsModal
        open={showProductsModal}
        onClose={() => setShowProductsModal(false)}
        onAddProducts={handleAddProducts}
      />
    </>
  );
}
