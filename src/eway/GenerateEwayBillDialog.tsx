import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Invoice } from "@/api/invoices";
import { isBuyerGstVerified, type Buyer } from "@/api/buyers";
import { prepareBill, prepareBulkExport } from "./export";
import { invoiceToEwayInput, type TransportOverrides } from "./fromInvoice";
import { normalizeVehicleNo } from "./gst";

interface GenerateEwayBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  buyer: Buyer | undefined;
}

// Every field these two validation layers produce for the buyer's own
// PIN/state -- surfacing "Missing or invalid PIN code" etc. verbatim when
// the real cause is simply "nobody's verified this buyer's GST yet" reads as
// a confusing pile of unrelated errors. Hidden in favour of one clear
// message + a way to go fix the actual cause (see below).
const GST_DERIVED_FIELDS = new Set([
  "to.pincode",
  "to.stateCode",
  "to.actualStateCode",
  "toPincode",
  "toStateCode",
  "actualToStateCode",
]);

/**
 * Bulk-upload JSON for a single invoice -- phase 1 of e-way bill support
 * (see EWAY_BILL.md): the app produces the file, the portal upload stays
 * manual. Available on every invoice above the e-way bill threshold
 * regardless of whether the buyer's GST info is verified -- verification is
 * informational (see the buyer page), not a hard gate here. The normal
 * validation below (missing PIN, bad HSN, etc.) is the real gate, same as
 * it would be for any other data problem. The one exception: an unverified
 * buyer's PIN/state errors are hidden behind a single "not verified" message
 * (see GST_DERIVED_FIELDS below) instead of the raw field-level errors,
 * since those are a predictable consequence of no verification yet, not a
 * distinct problem to individually explain.
 */
export default function GenerateEwayBillDialog({
  open,
  onOpenChange,
  invoice,
  buyer,
}: GenerateEwayBillDialogProps) {
  const navigate = useNavigate();
  const today = dayjs().format("YYYY-MM-DD");
  const [vehicleNo, setVehicleNo] = useState(invoice.vehicleNumber ?? "");
  // The only field in this whole dialog the user actually types into --
  // everything else validate.ts can flag (seller/buyer address, HSN, totals,
  // tax rates) reflects data fixed elsewhere, so there's no "haven't touched
  // it yet" for those and showing them immediately is correct. This one
  // starts empty when the invoice has no saved vehicle number, so showing
  // its error on open (before any interaction) would just be noise; it's
  // set true by the first Download click instead, same as a form only
  // showing validation once you try to submit it.
  const [vehicleTouched, setVehicleTouched] = useState(false);

  const prepared = useMemo(() => {
    const transport: TransportOverrides = { vehicleNo };
    return prepareBill(invoiceToEwayInput(invoice, buyer, transport), { today });
  }, [invoice, buyer, vehicleNo, today]);

  const verified = buyer ? isBuyerGstVerified(buyer) : false;
  const allProblems = prepared.issues.filter((i) => i.severity !== "info");
  // Everything else (bad HSN, missing vehicle no., etc.) is a normal,
  // independently fixable problem -- this one specifically means there's
  // nothing to fix here yet, so the whole form is beside the point until
  // verification happens. See GST_DERIVED_FIELDS above.
  const needsVerification = !verified && allProblems.some((i) => GST_DERIVED_FIELDS.has(i.field));

  const goVerify = () => {
    if (!buyer) return;
    onOpenChange(false);
    navigate(`/buyer/${buyer.id}`, { state: { openGstTab: true } });
  };

  const download = () => {
    // First click with an empty/invalid vehicle no.: reveal the error
    // instead of downloading -- see vehicleTouched above.
    if (!vehicleTouched) setVehicleTouched(true);
    if (!prepared.ok) return;
    const { json } = prepareBulkExport([prepared.input], { today });
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeNumber = invoice.invoiceNumber.replace(/[^A-Za-z0-9]/g, "_");
    a.download = `ewb_${safeNumber}_${dayjs().format("YYYYMMDD_HHmm")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const problems = allProblems.filter(
    (i) => !GST_DERIVED_FIELDS.has(i.field) && (vehicleTouched || i.field !== "transport.vehicleNo")
  );
  // The Download button itself stays clickable even with an untouched,
  // currently-blank vehicle no. -- clicking it is what reveals that error
  // (see download() above). Any other real problem still disables it
  // outright, same as before.
  const canAttemptDownload = !problems.some((i) => i.severity === "error");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate E-way Bill</DialogTitle>
        </DialogHeader>

        {needsVerification ? (
          <GstNotVerifiedNotice
            buyerName={buyer?.name ?? invoice.buyerNameSnapshot}
            onVerify={buyer ? goVerify : undefined}
          />
        ) : (
          <>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ewb-vehicle">Vehicle no.</Label>
                <Input
                  id="ewb-vehicle"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(normalizeVehicleNo(e.target.value))}
                />
              </div>

              {problems.length > 0 && (
                <ul className="text-sm space-y-1.5">
                  {problems.map((i, k) => (
                    <li key={k} className={i.severity === "error" ? "text-destructive" : "text-amber-600"}>
                      <span className="font-mono text-xs">{i.field}</span> — {i.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={download} disabled={!canAttemptDownload}>
                <Download className="h-4 w-4 mr-1" /> Download JSON
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Replaces the whole form (vehicle no., Close/Download) when the only
 * reason there's anything to fix is that this buyer isn't GST-verified yet
 * -- there's nothing else useful to fill in or download until that changes,
 * so showing the normal generation UI around this message would just be
 * noise. `onVerify` is undefined only for the rare case of an invoice whose
 * buyer record can no longer be found (e.g. deleted) -- verification isn't
 * actionable from here then.
 */
function GstNotVerifiedNotice({
  buyerName,
  onVerify,
}: {
  buyerName: string;
  onVerify: (() => void) | undefined;
}) {
  return (
    <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-500">
      <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="space-y-2">
        <p>
          GST info isn't verified for this buyer yet. Please complete
          verification to start generating e-way bills for {buyerName}.
        </p>
        {onVerify && (
          <Button type="button" variant="outline" size="sm" onClick={onVerify}>
            Verify GST Info
          </Button>
        )}
      </div>
    </div>
  );
}
