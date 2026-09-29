import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { Loader2, BadgeCheck, ShieldAlert } from "lucide-react";
import {
  createBuyer,
  updateBuyer,
  latestGstVerification,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import GstVerifiedBadge from "./GstVerifiedBadge";
import { STATE_CODES } from "@/eway/codes";

interface BuyerFormValues {
  name: string;
  address: string;
  gstin?: string;
  phone?: string;
}

type DrawerTab = "details" | "gst";

interface BuyerDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  buyerId?: string;
  onSuccess?: (buyer?: Buyer) => void;
  // Which tab to land on when the drawer opens -- "gst" for the buyer
  // detail page's "View GST Info" button, "details" (default) for "Edit".
  // Only meaningful in edit mode; create mode never shows the GST tab.
  initialTab?: DrawerTab;
}

export default function BuyerDrawer({
  open,
  onClose,
  mode,
  buyerId,
  onSuccess,
  initialTab = "details",
}: BuyerDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>(initialTab);

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
    if (!open) return;
    setError(null);
    // Reads the current initialTab whenever the drawer opens (the caller
    // sets both in the same click handler, so it's already up to date by
    // here) without re-running on every initialTab change -- that would
    // snap the tab back if included, fighting a manual click mid-session.
    setActiveTab(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, buyerId, open]);

  const handleSubmit = async (values: BuyerFormValues) => {
    setIsLoading(true);
    setError(null);

    const data: BuyerFormData = {
      name: values.name,
      address: values.address,
      gstin: values.gstin,
      phone: values.phone,
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
      });
    } else if (mode === "create") {
      reset({
        name: "",
        address: "",
        gstin: "",
        phone: "",
      });
    }
  }, [buyer, mode, open, reset]);

  const submitButtonText = mode === "create" ? "Create" : "Update";
  const loadingButtonText = mode === "create" ? "Creating..." : "Updating...";

  // The latest scripts/gstin-lookup run, but only if it's still for this
  // buyer's current GSTIN (see latestGstVerification) -- a stale
  // verification from a since-changed GSTIN counts as not verified and its
  // data isn't shown. Edit mode only: a not-yet-created buyer can't have
  // been verified against anything.
  const gstDetail = buyer ? latestGstVerification(buyer) : undefined;
  const gstRaw = gstDetail?.raw;
  const showGstTab = mode === "edit" && !!buyer?.gstin;

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

  const formContent = (
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
            <p className="text-sm text-destructive">{errors.name.message}</p>
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
            <p className="text-sm text-destructive">{errors.phone.message}</p>
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
            <p className="text-sm text-destructive">{errors.gstin.message}</p>
          )}
        </div>

        {showGstTab && (
          <p className="text-sm text-muted-foreground">
            Ship-to PIN code and state are on the <strong>GST Info</strong> tab
            for this buyer — sourced from the government lookup, not typed
            here.
          </p>
        )}
      </div>

      <div className="flex justify-end w-full">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? loadingButtonText : submitButtonText}
        </Button>
      </div>
    </form>
  );

  const stateName = (code: number | null) =>
    code ? STATE_CODES[code] ?? String(code) : "Not set";

  const hasJurisdiction = !!(gstRaw?.adminOffice?.length || gstRaw?.otherOffice?.length);
  const hasBusinessActivity = !!(
    gstRaw?.natureOfCoreBusinessActivity || gstRaw?.natureOfBusinessActivities?.length
  );
  const hasGoodsServices = !!gstRaw?.goodsServices?.length;
  const hasRegistrationDetails = !!(
    gstDetail?.registrationDate ||
    gstDetail?.constitutionOfBusiness ||
    gstDetail?.gstinStatus ||
    gstDetail?.taxpayerType
  );

  const gstContent = buyer && (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <GstVerifiedBadge
          gstin={buyer.gstin}
          verifiedAt={gstDetail?.verifiedAt ?? null}
        />
      </div>

      {gstDetail ? (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground text-left">
            <strong>Legal Name:</strong> {gstDetail.legalName || "—"}
          </p>
          <p className="text-sm text-muted-foreground text-left">
            <strong>Trade Name:</strong> {gstDetail.tradeName || "—"}
          </p>
          <p className="text-sm text-muted-foreground text-left">
            <strong>Registered Address:</strong>{" "}
            {gstDetail.principalAddress || "—"}
          </p>
          <p className="text-sm text-muted-foreground text-left">
            <strong>Ship-to PIN code:</strong> {gstDetail.pincode ?? "Not set"}
          </p>
          <p className="text-sm text-muted-foreground text-left">
            <strong>Ship-to State:</strong> {stateName(gstDetail.stateCode)}
          </p>
          <p className="text-sm text-muted-foreground text-left">
            <strong>Verified:</strong>{" "}
            {dayjs(gstDetail.verifiedAt).format("DD/MM/YYYY")}
          </p>
        </div>
      ) : (
        <p className="text-sm text-amber-700 dark:text-amber-500 text-left">
          Not verified against the government's GST records yet — no
          ship-to PIN/state available for this buyer until it is. Run{" "}
          <code>scripts/gstin-lookup</code> to verify this buyer against
          GST's own Search Taxpayer records.
        </p>
      )}

      {(hasRegistrationDetails || hasJurisdiction || hasBusinessActivity || hasGoodsServices) && (
        <Accordion type="multiple">
          {hasRegistrationDetails && (
            <AccordionItem value="registration">
              <AccordionTrigger>Registration Details</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <p className="text-sm text-muted-foreground text-left">
                    <strong>Registration Date:</strong>{" "}
                    {gstDetail?.registrationDate || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground text-left">
                    <strong>Constitution:</strong>{" "}
                    {gstDetail?.constitutionOfBusiness || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground text-left">
                    <strong>GSTIN Status:</strong>{" "}
                    {gstDetail?.gstinStatus || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground text-left">
                    <strong>Taxpayer Type:</strong>{" "}
                    {gstDetail?.taxpayerType || "—"}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {hasJurisdiction && (
            <AccordionItem value="jurisdiction">
              <AccordionTrigger>Jurisdiction</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {gstRaw?.adminOffice && gstRaw.adminOffice.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-left mb-1">
                        Administrative Office
                      </p>
                      {gstRaw.adminOffice.map((line, i) => (
                        <p
                          key={i}
                          className="text-sm text-muted-foreground text-left"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                  {gstRaw?.otherOffice && gstRaw.otherOffice.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-left mb-1">
                        State Jurisdiction
                      </p>
                      {gstRaw.otherOffice.map((line, i) => (
                        <p
                          key={i}
                          className="text-sm text-muted-foreground text-left"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {hasBusinessActivity && (
            <AccordionItem value="business">
              <AccordionTrigger>Business Activity</AccordionTrigger>
              <AccordionContent className="space-y-1">
                {gstRaw?.natureOfCoreBusinessActivity && (
                  <p className="text-sm text-muted-foreground text-left">
                    {gstRaw.natureOfCoreBusinessActivity}
                  </p>
                )}
                {gstRaw?.natureOfBusinessActivities &&
                  gstRaw.natureOfBusinessActivities.length > 0 && (
                    <p className="text-sm text-muted-foreground text-left">
                      {gstRaw.natureOfBusinessActivities.join(", ")}
                    </p>
                  )}
              </AccordionContent>
            </AccordionItem>
          )}

          {hasGoodsServices && (
            <AccordionItem value="goods">
              <AccordionTrigger>
                Goods &amp; Services ({gstRaw?.goodsServices?.length})
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>HSN/SAC</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gstRaw?.goodsServices?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.hsn}</TableCell>
                        <TableCell className="whitespace-normal">
                          {item.description}
                        </TableCell>
                        <TableCell className="capitalize">
                          {item.type}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      {gstDetail && (
        <p className="text-xs text-muted-foreground text-left">
          From the {dayjs(gstDetail.verifiedAt).format("DD/MM/YYYY")} GST
          Search Taxpayer lookup.
        </p>
      )}
    </div>
  );

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

          {showGstTab ? (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as DrawerTab)}
            >
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="gst">
                  {gstDetail ? (
                    <BadgeCheck className="text-green-600 dark:text-green-500" />
                  ) : (
                    <ShieldAlert className="text-amber-600 dark:text-amber-500" />
                  )}
                  GST Info
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details">{formContent}</TabsContent>
              <TabsContent value="gst">{gstContent}</TabsContent>
            </Tabs>
          ) : (
            formContent
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
