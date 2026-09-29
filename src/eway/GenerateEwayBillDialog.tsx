import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Download } from "lucide-react";
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
import type { Buyer } from "@/api/buyers";
import { prepareBill, prepareBulkExport } from "./export";
import { invoiceToEwayInput, type TransportOverrides } from "./fromInvoice";
import { normalizeVehicleNo } from "./gst";

interface GenerateEwayBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  buyer: Buyer | undefined;
}

/**
 * Bulk-upload JSON for a single invoice -- phase 1 of e-way bill support
 * (see EWAY_BILL.md): the app produces the file, the portal upload stays
 * manual. Available on every invoice above the e-way bill threshold
 * regardless of whether the buyer's GST info is verified -- verification is
 * informational (see the buyer page), not a hard gate here. The normal
 * validation below (missing PIN, bad HSN, etc.) is the real gate, same as
 * it would be for any other data problem.
 */
export default function GenerateEwayBillDialog({
  open,
  onOpenChange,
  invoice,
  buyer,
}: GenerateEwayBillDialogProps) {
  const today = dayjs().format("YYYY-MM-DD");
  const [vehicleNo, setVehicleNo] = useState(invoice.vehicleNumber ?? "");
  const [transporterId, setTransporterId] = useState("");

  const prepared = useMemo(() => {
    const transport: TransportOverrides = { vehicleNo, transporterId };
    return prepareBill(invoiceToEwayInput(invoice, buyer, transport), { today });
  }, [invoice, buyer, vehicleNo, transporterId, today]);

  const problems = prepared.issues.filter((i) => i.severity !== "info");

  const download = () => {
    const { json } = prepareBulkExport([prepared.input], { today });
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeNumber = invoice.invoiceNumber.replace(/[^A-Za-z0-9]/g, "_");
    a.download = `ewb_${safeNumber}_${dayjs().format("YYYYMMDD_HHmm")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate E-way Bill</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Downloads a bulk-upload JSON for invoice {invoice.invoiceNumber} that
          you upload yourself at e-Waybill → Generate Bulk on the portal.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ewb-vehicle">Vehicle no.</Label>
            <Input
              id="ewb-vehicle"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(normalizeVehicleNo(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ewb-transporter">Transporter GSTIN</Label>
            <Input
              id="ewb-transporter"
              placeholder="If not self-transporting"
              maxLength={15}
              value={transporterId}
              onChange={(e) => setTransporterId(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {problems.length > 0 && (
          <ul className="text-sm space-y-1">
            {problems.map((i, k) => (
              <li key={k} className={i.severity === "error" ? "text-destructive" : "text-amber-600"}>
                <span className="font-mono text-xs">{i.field}</span> — {i.message}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={download} disabled={!prepared.ok}>
            <Download className="h-4 w-4 mr-1" /> Download JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
