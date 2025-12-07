import {
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Autocomplete,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { Controller, useFieldArray } from "react-hook-form";
import dayjs from "dayjs";
import { useInvoice } from "../contexts/InvoiceProvider";

//
// ===========================
// FULL TYPES
// ===========================
//
export type InvoiceItem = {
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
};

export type InvoiceForm = {
  invoiceNumber: string;
  vehicleNumber: string;
  date: string;

  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;

  items: InvoiceItem[];

  discount: number;
  cgst: number;
  sgst: number;
  igst: number;

  // NEW TOTAL SECTIONS (computed automatically)
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;

  // Seller
  sellerName: string;
  sellerAddress: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerGstin: string;

  // Auto-generated
  amountInWords: string;
};

export default function InvoiceFormPage() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ p: 2, width: "100%", mt: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Create Invoice
        </Typography>

        <Stack spacing={2}>
          <InvoiceFormDetails />
          <InvoiceFormItems />
          <InvoiceFormTaxesAndDiscounts />
        </Stack>
      </Paper>
    </LocalizationProvider>
  );
}

function InvoiceFormDetails() {
  const { form } = useInvoice();
  const { control } = form;
  return (
    <>
      <Typography align="left" variant="h6">
        Details:
      </Typography>
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
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          Buyer Details
        </AccordionSummary>
        <AccordionDetails>
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
        </AccordionDetails>
      </Accordion>
    </>
  );
}

function InvoiceFormItems() {
  const { form } = useInvoice();
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  return (
    <>
      <Typography align="left" variant="h6">
        Items ({fields.length})
      </Typography>

      <Stack spacing={3}>
        {fields.map((item, index) => (
          <Paper key={item.id} sx={{ p: 2 }} elevation={1}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1">Item {index + 1}</Typography>
                <IconButton color="error" onClick={() => remove(index)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>

              <Controller
                name={`items.${index}.description`}
                control={control}
                render={({ field }) => (
                  <TextField label="Description" fullWidth {...field} />
                )}
              />

              <Controller
                name={`items.${index}.hsn`}
                control={control}
                render={({ field }) => (
                  <TextField label="HSN Code" fullWidth {...field} />
                )}
              />

              <Stack direction="row" spacing={1}>
                <Controller
                  name={`items.${index}.qty`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="number"
                      label="Qty"
                      sx={{ width: "33%" }}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.unit`}
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      freeSolo
                      options={["Kg", "Pcs", "Meter", "Roll", "Bag"]}
                      value={value || ""}
                      onChange={(_, newValue) => onChange(newValue)}
                      onInputChange={(_, newInputValue) =>
                        onChange(newInputValue)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Unit"
                          sx={{ width: "100%" }}
                        />
                      )}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.rate`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="number"
                      label="Rate"
                      sx={{ width: "33%" }}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />
              </Stack>
            </Stack>
          </Paper>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() =>
            append({
              description: "",
              hsn: "",
              qty: 1,
              unit: "Kg",
              rate: 0,
            })
          }
        >
          Add Item
        </Button>
      </Stack>
    </>
  );
}

function InvoiceFormTaxesAndDiscounts() {
  const { form } = useInvoice();
  const { control } = form;

  return (
    <>
      <Typography align="left" variant="h6">
        Taxes & Discount
      </Typography>

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
            name="cgst"
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
            name="sgst"
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
            name="igst"
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
    </>
  );
}
