import { describe, expect, it } from "vitest";
import type { Invoice } from "../api/invoices";
import { toNicUnit } from "./codes";
import { buildEwayBill, toPortalDate } from "./build";
import { prepareBill, prepareBulkExport } from "./export";
import { invoiceToEwayInput, assessInvoice } from "./fromInvoice";
import { isValidVehicleNo, stateCodeFromGstin } from "./gst";
import { extractPincode, pincodeMatchesState } from "./pincode";
import { assessEwayRequirement } from "./requirement";
import { validateEwayInput } from "./validate";

const TODAY = "2026-09-24";
const opts = { today: TODAY };

// Intra-state (J&K -> J&K) invoice: 2 items, Rs 500 discount, 18% GST.
function makeInvoice(over: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv1",
    invoiceNumber: "2026-27/101",
    vehicleNumber: "JK01AB1234",
    date: "2026-09-22T00:00:00.000Z",
    buyerId: "b1",
    buyerNameSnapshot: "Bashir Electricals",
    buyerAddressSnapshot: "Lal Chowk, Srinagar 190001",
    buyerGstinSnapshot: "01ABCDE1234F1Z5",
    buyerPhoneSnapshot: null,
    sellerNameSnapshot: "Khaldun Plastic Industries",
    sellerAddressSnapshot: "28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR (J&K) 190010",
    sellerGstinSnapshot: "01BSGPB0427H1ZJ",
    sellerEmailSnapshot: "x@y.z",
    sellerPhoneSnapshot: "1",
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 0,
    cgstAmount: 6975,
    sgstAmount: 6975,
    igstAmount: 0,
    discount: 500,
    subtotal: 77500,
    total: 91450,
    amountInWords: "",
    status: "pending",
    internalNote: null,
    createdAt: "",
    updatedAt: "",
    items: [
      { id: "1", productId: "p1", description: "PVC Pipe 1\" 6kg", hsn: "3917", qty: 100, unit: "BDL", rate: 500, lineTotal: 50000, position: 0 },
      { id: "2", productId: "p2", description: "Wire 1.5 sq mm (90m)", hsn: "8544", qty: 50, unit: "RL", rate: 550, lineTotal: 27500 + 500, position: 1 },
    ],
    ...over,
  };
}
// subtotal above = 78000 gross - 500 discount = 77500; tax 9% = 6975.

describe("assessEwayRequirement", () => {
  it("requires a bill only when value is strictly above 50,000", () => {
    const f = (v: number) => assessEwayRequirement({ invoiceValue: v, fromStateCode: 1, toStateCode: 7 }).required;
    expect(f(50_000)).toBe(false);
    expect(f(50_001)).toBe(true);
  });
  it("applies a state's intra-state limit only to intra-state movement", () => {
    const args = { invoiceValue: 80_000 };
    expect(assessEwayRequirement({ ...args, fromStateCode: 7, toStateCode: 7 }).required).toBe(false); // Delhi: 1L
    expect(assessEwayRequirement({ ...args, fromStateCode: 7, toStateCode: 6 }).required).toBe(true);
  });
  it("does not require a bill for non-goods", () => {
    expect(assessEwayRequirement({ invoiceValue: 9e6, fromStateCode: 1, toStateCode: 1, isGoods: false }).required).toBe(false);
  });
  it("assesses an invoice using GSTIN-derived states", () => {
    const r = assessInvoice(makeInvoice());
    expect(r).toMatchObject({ required: true, intraState: true, threshold: 50_000 });
  });
});

describe("codes and helpers", () => {
  it("maps app units to NIC units", () => {
    expect(toNicUnit("BDL")).toBe("BDL");
    expect(toNicUnit("DZ")).toBe("DOZ");
    expect(toNicUnit("RL")).toBe("ROL");
    expect(toNicUnit("pc")).toBe("PCS");
    expect(toNicUnit("nos")).toBe("NOS");
    expect(toNicUnit("LOT")).toBeNull();
  });
  it("formats dates as dd/mm/yyyy", () => {
    expect(toPortalDate("2026-09-05")).toBe("05/09/2026");
    expect(toPortalDate("2026-09-05T00:00:00.000Z")).toBe("05/09/2026");
    expect(toPortalDate("05/09/2026")).toBe("");
  });
  it("reads state from GSTIN and validates vehicle numbers", () => {
    expect(stateCodeFromGstin("01BSGPB0427H1ZJ")).toBe(1);
    expect(stateCodeFromGstin("URP")).toBeNull();
    for (const v of ["JK01AB1234", "KA12K1234", "KA123456", "KAR1234", "KA123K1234", "KA12KAR1234", "DF123456"]) {
      expect(isValidVehicleNo(v)).toBe(true);
    }
    expect(isValidVehicleNo("1234")).toBe(false);
    expect(isValidVehicleNo("JK 01 AB 1234")).toBe(true);
  });
  it("checks PIN against state", () => {
    expect(pincodeMatchesState(190001, 1)).toBe(true);
    expect(pincodeMatchesState(110001, 1)).toBe(false);
    expect(pincodeMatchesState(605001, 34)).toBe(true); // Puducherry
    expect(pincodeMatchesState(605001, 33)).toBe(true); // shares 60x with Tamil Nadu
    expect(pincodeMatchesState(905001, 1)).toBeNull(); // unknown prefix
    expect(extractPincode("Lal Chowk, Srinagar - 190001 (J&K)")).toBe(190001);
    expect(extractPincode("Shop 1234567, Srinagar")).toBeNull();
  });
});

describe("invoiceToEwayInput / buildEwayBill", () => {
  const input = invoiceToEwayInput(makeInvoice());
  const bill = buildEwayBill(input);

  it("produces the expected bulk entry", () => {
    expect(bill).toEqual({
      userGstin: "01BSGPB0427H1ZJ",
      supplyType: "O",
      subSupplyType: 1,
      docType: "INV",
      docNo: "2026-27/101",
      docDate: "22/09/2026",
      fromGstin: "01BSGPB0427H1ZJ",
      fromTrdName: "Khaldun Plastic Industries",
      fromAddr1: "28A-SIDCO INDL. COMPLEX SHALLATENG SRINAGAR J&K 190010",
      fromAddr2: "",
      fromPlace: "SRINAGAR",
      fromPincode: 190010,
      fromStateCode: 1,
      actualFromStateCode: 1,
      toGstin: "01ABCDE1234F1Z5",
      toTrdName: "Bashir Electricals",
      toAddr1: "Lal Chowk, Srinagar 190001",
      toAddr2: "",
      toPlace: "Srinagar",
      toPincode: 190001,
      toStateCode: 1,
      actualToStateCode: 1,
      totalValue: 77500,
      cgstValue: 6975,
      sgstValue: 6975,
      igstValue: 0,
      cessValue: 0,
      TotNonAdvolVal: 0,
      OthValue: 0,
      totInvValue: 91450,
      transMode: 1,
      transDistance: 0,
      transporterName: "",
      transporterId: "",
      transDocNo: "",
      transDocDate: "22/09/2026",
      vehicleNo: "JK01AB1234",
      vehicleType: "R",
      mainHsnCode: "3917",
      itemList: [
        { itemNo: 1, productName: "PVC Pipe 1 6kg", productDesc: "PVC Pipe 1 6kg", hsnCode: "3917", quantity: 100, qtyUnit: "BDL", taxableAmount: 49679.49, sgstRate: 9, cgstRate: 9, igstRate: 0, cessRate: 0, cessNonAdvol: 0 },
        { itemNo: 2, productName: "Wire 1.5 sq mm 90m", productDesc: "Wire 1.5 sq mm 90m", hsnCode: "8544", quantity: 50, qtyUnit: "ROL", taxableAmount: 27820.51, sgstRate: 9, cgstRate: 9, igstRate: 0, cessRate: 0, cessNonAdvol: 0 },
      ],
    });
  });

  it("allocates the discount so item taxable amounts sum to the taxable value", () => {
    const sum = bill.itemList.reduce((s, i) => s + i.taxableAmount, 0);
    expect(Math.round(sum * 100)).toBe(Math.round(bill.totalValue * 100));
  });

  it("keeps the official key order", () => {
    const keys = Object.keys(bill);
    expect(keys.slice(0, 8)).toEqual(["userGstin", "supplyType", "subSupplyType", "docType", "docNo", "docDate", "fromGstin", "fromTrdName"]);
    expect(keys[keys.length - 1]).toBe("itemList");
  });
});

describe("validation", () => {
  const good = () => invoiceToEwayInput(makeInvoice());
  const errors = (i = good()) => validateEwayInput(i, opts).filter((x) => x.severity === "error");

  it("passes a clean invoice", () => {
    expect(errors()).toEqual([]);
    expect(prepareBill(good(), opts).ok).toBe(true);
  });

  it("flags a PIN that doesn't match the state", () => {
    const i = good();
    i.to.pincode = 110001;
    expect(errors(i).map((e) => e.field)).toContain("to.pincode");
  });

  it("flags a missing seller PIN", () => {
    const i = invoiceToEwayInput(makeInvoice({ sellerAddressSnapshot: "28A-SIDCO SRINAGAR" }));
    expect(errors(i).map((e) => e.field)).toContain("from.pincode");
  });

  it("flags tax totals that don't add up", () => {
    const i = good();
    i.totInvValue = 95000;
    expect(errors(i).map((e) => e.field)).toContain("totInvValue");
    const j = good();
    j.cgstValue = 6000;
    expect(errors(j).map((e) => e.field)).toContain("cgstValue");
  });

  it("flags IGST on an intra-state supply", () => {
    const i = good();
    i.igstRate = 18;
    i.igstValue = 13950;
    expect(errors(i).map((e) => e.field)).toContain("igst");
  });

  it("flags bad HSN and units", () => {
    const i = good();
    i.items[0].hsn = "39";
    i.items[1].unit = "LOT";
    const f = errors(i).map((e) => e.field);
    expect(f).toContain("items[1].hsn");
    expect(f).toContain("items[2].unit");
  });

  it("checks distance against the PIN estimate when one is available", () => {
    const i = good();
    i.transport.distanceKm = 400;
    const est = { ...opts, estimateDistanceKm: () => 100 };
    expect(validateEwayInput(i, est).some((x) => x.field === "transport.distanceKm" && x.severity === "error")).toBe(true);
    i.transport.distanceKm = 105;
    expect(validateEwayInput(i, est).some((x) => x.field === "transport.distanceKm" && x.severity === "error")).toBe(false);
    i.transport.distanceKm = 4001;
    expect(errors(i).map((e) => e.field)).toContain("transport.distanceKm");
  });

  it("treats distance 0 as portal-calculated, not an error", () => {
    const issues = validateEwayInput(good(), opts).filter((x) => x.field === "transport.distanceKm");
    expect(issues).toEqual([expect.objectContaining({ severity: "info" })]);
  });

  it("requires Part-B for road, and a valid vehicle number", () => {
    const i = good();
    i.transport.vehicleNo = "";
    expect(errors(i).map((e) => e.field)).toContain("transport.vehicleNo");
    i.transport.transporterId = "01ABCDE1234F1Z5";
    expect(errors(i).map((e) => e.field)).not.toContain("transport.vehicleNo");
    i.transport.vehicleNo = "BAD";
    expect(errors(i).map((e) => e.field)).toContain("transport.vehicleNo");
  });

  it("rejects bad or future dates", () => {
    const i = good();
    i.docDate = "2026-09-25";
    expect(errors(i).map((e) => e.field)).toContain("docDate");
    i.docDate = "2026-13-40";
    expect(errors(i).map((e) => e.field)).toContain("docDate");
    i.docDate = "22/09/2026";
    expect(errors(i).map((e) => e.field)).toContain("docDate");
  });

  it("requires a state for an unregistered buyer, inferring it from the PIN when unambiguous", () => {
    const inv = makeInvoice({ buyerGstinSnapshot: null, buyerAddressSnapshot: "Karol Bagh, Delhi 110005" });
    const i = invoiceToEwayInput(inv);
    expect(i.to).toMatchObject({ gstin: "URP", stateCode: 7 });
    const inv2 = makeInvoice({ buyerGstinSnapshot: null, buyerAddressSnapshot: "Somewhere" });
    expect(errors(invoiceToEwayInput(inv2)).map((e) => e.field)).toContain("to.stateCode");
  });
});

describe("prepareBulkExport", () => {
  it("includes only bills without errors", () => {
    const bad = invoiceToEwayInput(makeInvoice({ invoiceNumber: "2026-27/102" }));
    bad.items[0].hsn = "1";
    const r = prepareBulkExport([invoiceToEwayInput(makeInvoice()), bad], opts);
    expect(r.includedCount).toBe(1);
    expect(r.file.version).toBe("1.0.0918");
    expect(r.file.billLists.map((b) => b.docNo)).toEqual(["2026-27/101"]);
    expect(r.prepared[1].ok).toBe(false);
    expect(JSON.parse(r.json).billLists).toHaveLength(1);
  });
});
