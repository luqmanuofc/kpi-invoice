import { TextField, Stack, Box, Typography } from "@mui/material";

import { Controller } from "react-hook-form";
import { useInvoice } from "../contexts/InvoiceProvider";

export default function InvoiceFormTaxesAndDiscountsPage() {
  const { form, computedData } = useInvoice();
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

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Sub Total
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ₹{computedData.subtotal.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Discount
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ₹{computedData.discount.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              CGST @ {computedData.cgstRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ₹{computedData.cgstAmount.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              SGST @ {computedData.sgstRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ₹{computedData.sgstAmount.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              IGST @ {computedData.igstRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ₹{computedData.igstAmount.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight="medium">
              Total Invoice Value
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              ₹{computedData.total.toFixed(2)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </>
  );
}
