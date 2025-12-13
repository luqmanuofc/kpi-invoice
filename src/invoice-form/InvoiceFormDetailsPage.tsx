import {
  TextField,
  Stack,
  Divider,
  Autocomplete,
  CircularProgress,
  IconButton,
  Box,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

import { Controller } from "react-hook-form";
import dayjs from "dayjs";
import { useInvoice } from "../contexts/InvoiceProvider";
import { useEffect, useState } from "react";
import { getBuyers, type Buyer } from "../api/buyers";
import { useNavigate } from "react-router-dom";
import { checkInvoiceNumber } from "../api/invoices";

export default function InvoiceFormDetailsPage() {
  const { form, invoiceNumberExists, setInvoiceNumberExists } = useInvoice();
  const { control, setValue, watch } = form;
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(true);
  const [isCheckingInvoiceNumber, setIsCheckingInvoiceNumber] = useState(false);
  const selectedBuyer = form.getValues("buyer");
  const invoiceNumber = watch("invoiceNumber");

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        setIsLoadingBuyers(true);
        const data = await getBuyers();
        setBuyers(data);
      } catch (err) {
        console.error("Failed to load buyers:", err);
      } finally {
        setIsLoadingBuyers(false);
      }
    };

    fetchBuyers();
  }, []);

  // Debounced invoice number validation
  useEffect(() => {
    if (!invoiceNumber || invoiceNumber.trim() === "") {
      setInvoiceNumberExists(false);
      return;
    }

    setIsCheckingInvoiceNumber(true);
    const timer = setTimeout(async () => {
      try {
        const result = await checkInvoiceNumber(invoiceNumber);
        setInvoiceNumberExists(result.exists);
      } catch (err) {
        console.error("Failed to check invoice number:", err);
      } finally {
        setIsCheckingInvoiceNumber(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timer);
      setIsCheckingInvoiceNumber(false);
    };
  }, [invoiceNumber]);
  return (
    <>
      <Stack spacing={2}>
        <Controller
          name="invoiceNumber"
          control={control}
          render={({ field }) => (
            <TextField
              label="Invoice Number"
              fullWidth
              {...field}
              error={invoiceNumberExists}
              helperText={
                invoiceNumberExists
                  ? "This invoice number is already in use"
                  : ""
              }
              slotProps={{
                input: {
                  endAdornment: isCheckingInvoiceNumber ? (
                    <CircularProgress size={20} />
                  ) : null,
                },
              }}
            />
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
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <Autocomplete
              options={buyers}
              getOptionLabel={(option) => option.name}
              getOptionKey={(option) => option.id}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={isLoadingBuyers}
              value={selectedBuyer}
              onChange={(_, value) => {
                if (value) {
                  setValue("buyer", value);
                } else {
                  setValue("buyer", null);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Buyer"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingBuyers ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ flex: 1 }}
            />
            <Tooltip
              title={selectedBuyer == null ? <>Add Buyer</> : <>Edit Buyer</>}
            >
              <IconButton
                color="primary"
                onClick={() => {
                  const returnUrl = encodeURIComponent(
                    window.location.pathname
                  );
                  if (selectedBuyer) {
                    navigate(
                      `/buyer/${selectedBuyer.id}?returnUrl=${returnUrl}`
                    );
                  } else {
                    navigate(`/buyer/create?returnUrl=${returnUrl}`);
                  }
                }}
                sx={{ mt: 1 }}
              >
                {selectedBuyer ? <EditIcon /> : <AddIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
      </>
    </>
  );
}
