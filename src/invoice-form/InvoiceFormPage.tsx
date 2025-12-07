import {
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
  IconButton,
  Autocomplete,
  StepButton,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";

import { Controller, useFieldArray } from "react-hook-form";
import dayjs from "dayjs";
import { useInvoice } from "../contexts/InvoiceProvider";
import { useState } from "react";

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

const steps = ["Invoice & Buyer", "Items", "Taxes & Discounts"];

export default function InvoiceFormPage() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const { handleGeneratePDF: onGeneratePdf } = useInvoice();
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ p: 2, width: "100%", minWidth: "450px", mt: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Create Invoice
        </Typography>
        <Box sx={{ width: "100%", mb: "2rem" }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={index}>
                <StepButton onClick={() => setActiveStep(index)}>
                  {label}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Box>

        {activeStep == 0 && (
          <>
            <InvoiceFormDetails />{" "}
            <Button
              style={{ marginTop: "1rem" }}
              fullWidth
              variant="outlined"
              onClick={() => setActiveStep(1)}
            >
              Next
            </Button>
          </>
        )}

        {activeStep == 1 && (
          <>
            <InvoiceFormItems />{" "}
            <div style={{ display: "flex", gap: "1rem" }}>
              <Button
                style={{ marginTop: "1rem" }}
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={() => setActiveStep(0)}
              >
                Back
              </Button>
              <Button
                style={{ marginTop: "1rem" }}
                fullWidth
                variant="outlined"
                onClick={() => setActiveStep(2)}
              >
                Next
              </Button>
            </div>
          </>
        )}
        {activeStep == 2 && (
          <>
            <InvoiceFormTaxesAndDiscounts />
            <div style={{ display: "flex", gap: "1rem" }}>
              <IconButton
                style={{ marginTop: "1rem" }}
                color="secondary"
                onClick={() => setActiveStep(1)}
              >
                <ArrowBackIcon />
              </IconButton>
              <Button
                style={{ marginTop: "1rem" }}
                fullWidth
                variant="contained"
                onClick={onGeneratePdf}
              >
                Download PDF
              </Button>
            </div>
          </>
        )}
      </Paper>
    </LocalizationProvider>
  );
}

function InvoiceFormDetails() {
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

function InvoiceFormItems() {
  const { form } = useInvoice();
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  return (
    <>
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
                      options={["Kg", "Pcs", "Bundle", "Dozen", "Bag"]}
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
          variant="contained"
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
  );
}
