import { buildBulkFile, buildEwayBill, serializeBulkFile } from "./build";
import { hasErrors, validateEwayBill, validateEwayInput, type ValidateOptions } from "./validate";
import type { EwayBill, EwayInput, EwayIssue } from "./types";

export interface PreparedBill {
  input: EwayInput;
  bill: EwayBill;
  issues: EwayIssue[];
  ok: boolean; // no errors
}

export function prepareBill(input: EwayInput, opts: ValidateOptions): PreparedBill {
  const bill = buildEwayBill(input);
  const issues = [...validateEwayInput(input, opts), ...validateEwayBill(bill)];
  return { input, bill, issues, ok: !hasErrors(issues) };
}

/**
 * Validate every input and build the bulk-upload file from the ones that pass.
 * Bills with errors are reported but left out, so one bad invoice never
 * blocks the rest of the upload.
 */
export function prepareBulkExport(inputs: EwayInput[], opts: ValidateOptions) {
  const prepared = inputs.map((i) => prepareBill(i, opts));
  const valid = prepared.filter((p) => p.ok);
  const file = buildBulkFile(valid.map((p) => p.bill));
  return { prepared, file, json: serializeBulkFile(file), includedCount: valid.length };
}
