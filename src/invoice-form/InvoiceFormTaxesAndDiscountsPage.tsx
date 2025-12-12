import { TextField, Stack } from "@mui/material";

import { Controller } from "react-hook-form";
import { useInvoice } from "../contexts/InvoiceProvider";

export default function InvoiceFormTaxesAndDiscountsPage() {
  const { form } = useInvoice();
  const { control } = form;

  return (
    <>
      <Stack spacing={2}>
        <Controller
          name="discount"
          control={control}
          render={({ field }) => (
            <TextField
              type="number"
              label="Discount (₹)"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />

        <Controller
          name="cgstRate"
          control={control}
          render={({ field }) => (
            <TextField
              type="number"
              label="CGST (%)"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />

        <Controller
          name="sgstRate"
          control={control}
          render={({ field }) => (
            <TextField
              type="number"
              label="SGST (%)"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />

        <Controller
          name="igstRate"
          control={control}
          render={({ field }) => (
            <TextField
              type="number"
              label="IGST (%)"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />
      </Stack>
    </>
  );
}
