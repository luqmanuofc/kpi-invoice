import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  type Product,
  type ProductFormData,
  type ProductCategory,
} from "../api/products";
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
} from "../hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "PVC_PIPE", label: "PVC Pipe" },
  { value: "PVC_BEND", label: "PVC Bend" },
  { value: "PVC_CHANNEL", label: "PVC Channel" },
  { value: "WIRE", label: "Wire" },
  { value: "ELECTRICAL_ACCESSORY", label: "Electrical Accessory" },
];

const CATEGORY_DEFAULTS: Record<
  ProductCategory,
  { hsn: string; defaultUnit: string }
> = {
  PVC_PIPE: { hsn: "3917", defaultUnit: "BDL" },
  PVC_BEND: { hsn: "3917", defaultUnit: "DZ" },
  PVC_CHANNEL: { hsn: "3917", defaultUnit: "BDL" },
  WIRE: { hsn: "8544", defaultUnit: "RL" },
  ELECTRICAL_ACCESSORY: { hsn: "8536", defaultUnit: "PC" },
};

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  productId?: string;
  onSuccess?: (product?: Product) => void;
}

export default function ProductDrawer({
  open,
  onClose,
  mode,
  productId,
  onSuccess,
}: ProductDrawerProps) {
  const [initialData, setInitialData] = useState<ProductFormData | undefined>();

  // Fetch product data when in edit mode
  const {
    data: product,
    isLoading: isFetching,
    error: fetchError,
  } = useProduct(mode === "edit" && open ? productId : undefined);

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error =
    fetchError?.message ||
    createMutation.error?.message ||
    updateMutation.error?.message ||
    null;

  useEffect(() => {
    if (mode === "edit" && product && open) {
      setInitialData({
        name: product.name,
        hsn: product.hsn,
        defaultPrice: product.defaultPrice,
        defaultUnit: product.defaultUnit,
        category: product.category,
      });
    } else if (mode === "create" && open) {
      // Reset form data when opening in create mode
      setInitialData(undefined);
    }
  }, [mode, product, open]);

  const handleSubmit = async (data: ProductFormData) => {
    try {
      let result;
      if (mode === "create") {
        result = await createMutation.mutateAsync(data);
      } else if (mode === "edit" && productId) {
        result = await updateMutation.mutateAsync({ id: productId, data });
      }

      // Call success callback to refresh product list
      if (onSuccess) {
        onSuccess(result);
      }

      // Close drawer on success
      onClose();
    } catch (err) {
      // Error is already handled by the mutation
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setInitialData(undefined);
      createMutation.reset();
      updateMutation.reset();
      onClose();
    }
  };

  const {
    register,
    handleSubmit: formSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    defaultValues: initialData,
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: "",
        hsn: CATEGORY_DEFAULTS.PVC_PIPE.hsn,
        defaultPrice: 0,
        defaultUnit: CATEGORY_DEFAULTS.PVC_PIPE.defaultUnit,
        category: "PVC_PIPE",
      });
    }
  }, [initialData, reset]);

  // Watch for category changes and auto-update HSN and defaultUnit
  const category = watch("category");
  useEffect(() => {
    if (category && CATEGORY_DEFAULTS[category]) {
      const { hsn, defaultUnit } = CATEGORY_DEFAULTS[category];
      setValue("hsn", hsn);
      setValue("defaultUnit", defaultUnit);
    }
  }, [category, setValue]);

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
            {mode === "create" ? "New Product" : "Edit Product"}
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
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <select
                  id="category"
                  {...register("category", {
                    required: "Category is required",
                  })}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.category ? "border-destructive" : ""
                  }`}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-destructive">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultPrice">
                  Default Price (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="defaultPrice"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  {...register("defaultPrice", {
                    required: "Default Price is required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Price must be positive" },
                  })}
                  className={errors.defaultPrice ? "border-destructive" : ""}
                />
                {errors.defaultPrice && (
                  <p className="text-sm text-destructive">
                    {errors.defaultPrice.message}
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
