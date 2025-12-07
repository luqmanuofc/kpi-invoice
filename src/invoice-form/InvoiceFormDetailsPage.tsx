import { TextField, Stack, Divider } from "@mui/material";

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

import { Controller } from "react-hook-form";
import dayjs from "dayjs";
import { useInvoice } from "../contexts/InvoiceProvider";

export default function InvoiceFormDetailsPage() {
  const { form } = useInvoice();
  const { control } = form;
  return (
    <>
      <Stack spacing={2}>
        <Controller
          name="invoiceNumber"
          control={control}
          render={({ field }) => (
            <TextField label="Invoice Number" fullWidth {...field} />
          )}
        />

        <Controller
          name="vehicleNumber"
          control={control}
          render={({ field }) => (
            <TextField label="Vehicle Number" fullWidth {...field} />
          )}
        />

        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <MobileDatePicker
              label="Invoice Date"
              value={dayjs(field.value)}
              onChange={(val) => field.onChange(val?.format("YYYY-MM-DD"))}
              slotProps={{ textField: { fullWidth: true } }}
            />
          )}
        />
      </Stack>

      {/* =============================
                BUYER DETAILS
            ============================== */}
      <Divider sx={{ width: "100%", mt: "1rem", mb: "1rem" }} />
      <>
        <Stack spacing={2}>
          <Controller
            name="buyerName"
            control={control}
            render={({ field }) => (
              <TextField label="Buyer Name" fullWidth {...field} />
            )}
          />

          <Controller
            name="buyerAddress"
            control={control}
            render={({ field }) => (
              <TextField
                label="Buyer Address"
                fullWidth
                multiline
                rows={3}
                {...field}
              />
            )}
          />

          <Controller
            name="buyerGstin"
            control={control}
            render={({ field }) => (
              <TextField label="Buyer GSTIN" fullWidth {...field} />
            )}
          />
        </Stack>
      </>
    </>
  );
}
