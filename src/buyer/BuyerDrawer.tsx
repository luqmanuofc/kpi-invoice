import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  createBuyer,
  updateBuyer,
  getBuyerById,
  type Buyer,
  type BuyerFormData,
} from "../api/buyers";
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
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<BuyerFormData | undefined>();

  useEffect(() => {
    if (mode === "edit" && buyerId && open) {
      const fetchBuyer = async () => {
        try {
          setIsFetching(true);
          setError(null);
          const buyer = await getBuyerById(buyerId);
          setInitialData({
            name: buyer.name,
            address: buyer.address,
            gstin: buyer.gstin || "",
            phone: buyer.phone || "",
          });
        } catch (err: any) {
          setError(err.message || "Failed to load buyer");
        } finally {
          setIsFetching(false);
        }
      };

      fetchBuyer();
    } else if (mode === "create" && open) {
      // Reset form data when opening in create mode
      setInitialData(undefined);
      setError(null);
    }
  }, [mode, buyerId, open]);

  const handleSubmit = async (data: BuyerFormData) => {
    setIsLoading(true);
    setError(null);

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
      setInitialData(undefined);
      onClose();
    }
  };

  const {
    register,
    handleSubmit: formSubmit,
    formState: { errors },
    reset,
  } = useForm<BuyerFormData>({
    defaultValues: initialData,
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: "",
        address: "",
        gstin: "",
        phone: "",
      });
    }
  }, [initialData, reset]);

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
          {error && (
            <Alert variant="destructive" className="mb-6">
              {error}
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
