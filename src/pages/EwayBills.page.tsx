import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Download, Loader2, ShieldAlert } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useInvoicesList } from "@/hooks/useInvoices";
import { useBuyers } from "@/hooks/useBuyers";
import type { Invoice } from "@/api/invoices";
import { blockedByGstVerification, type Buyer } from "@/api/buyers";
import { prepareBill, prepareBulkExport, type PreparedBill } from "@/eway/export";
import { assessInvoice, invoiceToEwayInput, type TransportOverrides } from "@/eway/fromInvoice";
import { normalizeVehicleNo } from "@/eway/gst";

interface Draft {
  vehicleNo: string;
  transporterId: string;
}

function transportFrom(inv: Invoice, d: Draft | undefined): TransportOverrides {
  return {
    vehicleNo: d?.vehicleNo ?? inv.vehicleNumber ?? "",
    transporterId: d?.transporterId ?? "",
  };
}

export default function EwayBillsPage() {
  const navigate = useNavigate();
  const today = dayjs().format("YYYY-MM-DD");
  const [startDate, setStartDate] = useState(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(today);
  const [showAll, setShowAll] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [verifyModalBuyer, setVerifyModalBuyer] = useState<Buyer | null>(null);

  const { data, isLoading, error } = useInvoicesList({
    page: 1,
    pageSize: 100,
    startDate,
    endDate,
    status: ["pending", "paid", "cheque_issued"],
  });
  const { data: buyers } = useBuyers();
  const buyersById = useMemo(() => {
    const m = new Map<string, Buyer>();
    for (const b of buyers ?? []) m.set(b.id, b);
    return m;
  }, [buyers]);

  const rows = useMemo(() => {
    return (data?.invoices ?? [])
      .map((inv) => {
        const buyer = buyersById.get(inv.buyerId);
        const req = assessInvoice(inv, buyer);
        const prepared: PreparedBill = prepareBill(
          invoiceToEwayInput(inv, buyer, transportFrom(inv, drafts[inv.id])),
          { today }
        );
        const needsVerification = blockedByGstVerification(req.required, buyer);
        return { inv, buyer, req, prepared, needsVerification };
      })
      .filter((r) => showAll || r.req.required);
  }, [data, buyersById, drafts, showAll, today]);

  const setDraft = (inv: Invoice, patch: Partial<Draft>) =>
    setDrafts((prev) => {
      const cur: Draft = prev[inv.id] ?? { vehicleNo: inv.vehicleNumber ?? "", transporterId: "" };
      return { ...prev, [inv.id]: { ...cur, ...patch } };
    });

  const chosen = rows.filter((r) => selected[r.inv.id] && r.prepared.ok && !r.needsVerification);

  const unverifiedBuyerCount = new Set(
    rows.filter((r) => r.needsVerification).map((r) => r.buyer!.id)
  ).size;

  const download = () => {
    const { json } = prepareBulkExport(chosen.map((r) => r.prepared.input), { today });
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ewb_bulk_${dayjs().format("YYYYMMDD_HHmm")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Buyers with no GSTIN aren't gated by verification (nothing to verify
  // against), but they still need PIN/state entered manually on their form.
  const buyersMissingPin = new Set(
    rows
      .filter((r) => !r.buyer?.gstin && (!r.buyer?.pincode || !r.buyer?.stateCode))
      .map((r) => r.inv.buyerNameSnapshot)
  );

  return (
    <div className="w-full h-full p-4 md:p-8 space-y-4">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold">E-way Bills</h1>
          <p className="text-sm text-muted-foreground">
            Export a bulk-upload JSON for the e-way bill portal (e-Waybill → Generate Bulk).
          </p>
        </div>
        <Button onClick={download} disabled={chosen.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Download JSON ({chosen.length})
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input type="date" className="w-40" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" className="w-40" value={endDate} min={startDate} max={today} onChange={(e) => setEndDate(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showAll} onCheckedChange={(v) => setShowAll(v === true)} />
          Show invoices below the limit too
        </label>
      </div>

      {unverifiedBuyerCount > 0 && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          {unverifiedBuyerCount} buyer{unverifiedBuyerCount === 1 ? "" : "s"} below need
          {unverifiedBuyerCount === 1 ? "s" : ""} GST verification before their e-way bills
          can be generated — run <code className="text-xs">scripts/gstin-lookup</code>.
        </Alert>
      )}

      {buyersMissingPin.size > 0 && (
        <Alert>
          Missing ship-to PIN/state for: {[...buyersMissingPin].join(", ")}. Add it once on
          each buyer's Edit form — see the "Ship-to PIN code" field.
        </Alert>
      )}

      {error && <Alert variant="destructive">{error instanceof Error ? error.message : "Failed to load invoices"}</Alert>}
      {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
      {!isLoading && rows.length === 0 && (
        <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
          No invoices in this range need an e-way bill.
        </div>
      )}
      {(data?.pagination.totalCount ?? 0) > 100 && (
        <Alert>Only the first 100 invoices in this range are shown; narrow the dates.</Alert>
      )}

      {rows.map(({ inv, buyer, req, prepared, needsVerification }) => {
        const d = drafts[inv.id];
        const problems = prepared.issues.filter((i) => i.severity !== "info");
        const rowReady = prepared.ok && !needsVerification;
        return (
          <Card key={inv.id}>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-1"
                  disabled={!prepared.ok && !needsVerification}
                  checked={!!selected[inv.id] && rowReady}
                  onCheckedChange={(v) => {
                    if (needsVerification) {
                      setVerifyModalBuyer(buyer ?? null);
                      return;
                    }
                    setSelected((s) => ({ ...s, [inv.id]: v === true }));
                  }}
                />
                <div className="grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{inv.invoiceNumber}</span>
                    <span className="text-sm text-muted-foreground">{dayjs(inv.date.slice(0, 10)).format("DD/MM/YYYY")}</span>
                    {needsVerification ? (
                      <Badge variant="destructive">
                        <ShieldAlert className="h-3 w-3" /> Buyer not verified
                      </Badge>
                    ) : (
                      <Badge variant={prepared.ok ? "default" : "destructive"}>
                        {prepared.ok ? "Ready" : "Needs fixes"}
                      </Badge>
                    )}
                    {!req.required && <Badge variant="outline">Below limit</Badge>}
                  </div>
                  <p className="text-sm truncate">
                    {inv.buyerNameSnapshot} · ₹{inv.total.toLocaleString("en-IN")}
                    <span className="text-muted-foreground">
                      {" "}· {req.intraState ? "intra" : "inter"}-state, limit ₹{req.threshold.toLocaleString("en-IN")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                <Input
                  placeholder="Vehicle no."
                  value={d?.vehicleNo ?? inv.vehicleNumber ?? ""}
                  onChange={(e) => setDraft(inv, { vehicleNo: normalizeVehicleNo(e.target.value) })}
                />
                <Input
                  placeholder="Transporter GSTIN (if not self-transporting)"
                  maxLength={15}
                  value={d?.transporterId ?? ""}
                  onChange={(e) => setDraft(inv, { transporterId: e.target.value.toUpperCase() })}
                />
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
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!verifyModalBuyer} onOpenChange={(open) => !open && setVerifyModalBuyer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Please validate GST info for this buyer
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {verifyModalBuyer?.name} has a GSTIN on file, but it hasn't been
            confirmed against the government's own records yet. E-way bills
            can only be generated for buyers whose GST details are verified —
            run <code className="text-xs">scripts/gstin-lookup</code> for
            this buyer, then come back here.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyModalBuyer(null)}>
              Close
            </Button>
            {verifyModalBuyer && (
              <Button onClick={() => navigate(`/buyer/${verifyModalBuyer.id}`)}>
                Go to buyer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
