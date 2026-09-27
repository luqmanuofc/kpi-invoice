import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  createBuyer,
  updateBuyer,
  type Buyer,
  type BuyerFormData,
} from "../api/buyers";
import { useBuyer } from "../hooks/useBuyers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { STATE_CODES } from "@/eway/codes";

// react-hook-form needs controlled string inputs; pincode/stateCode are
// converted to numbers (or null) only when submitting.
interface BuyerFormValues {
  name: string;
  address: string;
  gstin?: string;
  phone?: string;
  pincode: string;
  stateCode: string;
}

interface BuyerDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  buyerId?: string;
  onSuccess?: (buyer?: Buyer) => void;
}

export default function BuyerDrawer({
  open,
  onClose,
  mode,
  buyerId,
  onSuccess,
}: BuyerDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: buyer,
    isLoading: isFetching,
    error: fetchErrorObj,
  } = useBuyer(mode === "edit" && open ? buyerId : undefined);

  const fetchError = fetchErrorObj
    ? fetchErrorObj instanceof Error
      ? fetchErrorObj.message
      : "Failed to load buyer"
    : null;

  useEffect(() => {
    setError(null);
  }, [mode, buyerId, open]);

  const handleSubmit = async (values: BuyerFormValues) => {
    setIsLoading(true);
    setError(null);

    const data: BuyerFormData = {
      name: values.name,
      address: values.address,
      gstin: values.gstin,
      phone: values.phone,
      pincode: values.pincode.trim() ? Number(values.pincode) : null,
      stateCode: values.stateCode ? Number(values.stateCode) : null,
    };

    try {
      let result;
      if (mode === "create") {
        result = await createBuyer(data);
      } else if (mode === "edit" && buyerId) {
        result = await updateBuyer(buyerId, data);
      }

      // Call success callback to refresh buyer list
      if (onSuccess) {
        onSuccess(result);
      }

      // Close drawer on success
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          `An error occurred while ${
            mode === "create" ? "creating" : "updating"
          } the buyer`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const {
    register,
    handleSubmit: formSubmit,
    formState: { errors },
    reset,
  } = useForm<BuyerFormValues>();

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && buyer) {
      reset({
        name: buyer.name,
        address: buyer.address,
        gstin: buyer.gstin || "",
        phone: buyer.phone || "",
        pincode: buyer.pincode ? String(buyer.pincode) : "",
        stateCode: buyer.stateCode ? String(buyer.stateCode) : "",
      });
    } else if (mode === "create") {
      reset({
        name: "",
        address: "",
        gstin: "",
        phone: "",
        pincode: "",
        stateCode: "",
      });
    }
  }, [buyer, mode, open, reset]);

  const submitButtonText = mode === "create" ? "Create" : "Update";
  const loadingButtonText = mode === "create" ? "Creating..." : "Updating...";

  if (isFetching) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full! md:max-w-150!" showCloseButton={false}>
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full! md:max-w-150!">
        <SheetHeader>
          <SheetTitle className="text-xl">
            {mode === "create" ? "New Buyer" : "Edit Buyer"}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-auto px-4">
          {(error || fetchError) && (
            <Alert variant="destructive" className="mb-6">
              {error || fetchError}
            </Alert>
          )}

          <form onSubmit={formSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", { required: "Name is required" })}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...register("phone", {
                    validate: (value) => {
                      if (!value || value.trim() === "") return true;
                      if (/^\d{10}$/.test(value)) return true;
                      return "Please enter a valid 10 digit phone number or leave empty";
                    },
                  })}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="address"
                  rows={3}
                  {...register("address", { required: "Address is required" })}
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  {...register("gstin", {
                    validate: (value) => {
                      if (!value || value.trim() === "") return true;
                      if (value.length === 15) return true;
                      return "Please enter a valid 15 character GSTIN or leave empty";
                    },
                  })}
                  className={errors.gstin ? "border-destructive" : ""}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
                {errors.gstin && (
                  <p className="text-sm text-destructive">
                    {errors.gstin.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Ship-to PIN code</Label>
                  <Input
                    id="pincode"
                    inputMode="numeric"
                    maxLength={6}
                    {...register("pincode", {
                      validate: (value) => {
                        if (!value || value.trim() === "") return true;
                        return /^[1-9]\d{5}$/.test(value.trim())
                          ? true
                          : "Enter a 6 digit PIN code or leave empty";
                      },
                    })}
                    className={errors.pincode ? "border-destructive" : ""}
                  />
                  {errors.pincode && (
                    <p className="text-sm text-destructive">
                      {errors.pincode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateCode">Ship-to state</Label>
                  <select
                    id="stateCode"
                    {...register("stateCode")}
                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm dark:bg-input/30"
                  >
                    <option value="">Select state...</option>
                    {Object.entries(STATE_CODES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-4">
                Used only for e-way bills: the PIN code and state goods are
                shipped to. Fill this in once and every future invoice for
                this buyer reuses it.
              </p>
            </div>

            <div className="flex justify-end w-full">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? loadingButtonText : submitButtonText}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
