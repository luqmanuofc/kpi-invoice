import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { BankAccount } from "../api/settings";

type BankFormData = {
  bank: string;
  branch: string;
  accountNo: string;
  ifsc: string;
};

interface BankDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  bank?: BankAccount;
  onSubmit: (data: BankAccount) => Promise<void>;
}

export default function BankDrawer({
  open,
  onClose,
  mode,
  bank,
  onSubmit,
}: BankDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState<boolean>(bank?.visible ?? true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BankFormData>({
    defaultValues: {
      bank: bank?.bank ?? "",
      branch: bank?.branch ?? "",
      accountNo: bank?.accountNo ?? "",
      ifsc: bank?.ifsc ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        bank: bank?.bank ?? "",
        branch: bank?.branch ?? "",
        accountNo: bank?.accountNo ?? "",
        ifsc: bank?.ifsc ?? "",
      });
      setVisible(bank?.visible ?? true);
      setError(null);
    }
  }, [open, bank, reset]);

  const onFormSubmit = async (data: BankFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ ...data, visible });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save bank.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const submitLabel = mode === "create" ? "Create" : "Update";
  const loadingLabel = mode === "create" ? "Creating..." : "Updating...";

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full! md:max-w-150!">
        <SheetHeader>
          <SheetTitle className="text-xl">
            {mode === "create" ? "New Bank Account" : "Edit Bank Account"}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-auto px-4">
          {error && (
            <Alert variant="destructive" className="mb-6">
              {error}
            </Alert>
          )}

          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  {visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="text-sm">Show on invoice</Label>
                    <p className="text-xs text-muted-foreground">
                      {visible
                        ? "This bank appears in the Payment Information section."
                        : "This bank is hidden from invoices."}
                    </p>
                  </div>
                </div>
                <Switch checked={visible} onCheckedChange={setVisible} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank">
                  Bank Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bank"
                  {...register("bank", { required: "Bank name is required" })}
                  className={errors.bank ? "border-destructive" : ""}
                />
                {errors.bank && (
                  <p className="text-sm text-destructive">
                    {errors.bank.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">
                  Branch <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="branch"
                  {...register("branch", { required: "Branch is required" })}
                  className={errors.branch ? "border-destructive" : ""}
                />
                {errors.branch && (
                  <p className="text-sm text-destructive">
                    {errors.branch.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNo">
                  Account No <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="accountNo"
                  {...register("accountNo", {
                    required: "Account number is required",
                  })}
                  className={errors.accountNo ? "border-destructive" : ""}
                />
                {errors.accountNo && (
                  <p className="text-sm text-destructive">
                    {errors.accountNo.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifsc">
                  IFSC <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ifsc"
                  {...register("ifsc", { required: "IFSC is required" })}
                  className={errors.ifsc ? "border-destructive" : ""}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
                {errors.ifsc && (
                  <p className="text-sm text-destructive">
                    {errors.ifsc.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end w-full">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? loadingLabel : submitLabel}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
