import {
  Button,
  Paper,
  Typography,
  IconButton,
  StepButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";

import { useInvoice } from "../contexts/InvoiceProvider";
import InvoiceFormDetailsPage from "./InvoiceFormDetailsPage";
import InvoiceFormItemsPage from "./InvoiceFormItemsPage";
import InvoiceFormTaxesAndDiscountsPage from "./InvoiceFormTaxesAndDiscountsPage";

const steps = ["Invoice & Buyer", "Items", "Taxes & Discounts"];

export default function InvoiceFormPage() {
  const {
    handleCreateInvoice: onCreateInvoice,
    activeStep,
    setActiveStep,
  } = useInvoice();
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
            <InvoiceFormDetailsPage />{" "}
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
            <InvoiceFormItemsPage />{" "}
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
            <InvoiceFormTaxesAndDiscountsPage />
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
                onClick={onCreateInvoice}
              >
                Create Invoice
              </Button>
            </div>
          </>
        )}
      </Paper>
    </LocalizationProvider>
  );
}
