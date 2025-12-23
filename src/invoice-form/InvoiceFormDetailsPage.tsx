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
import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { checkInvoiceNumber } from "../api/invoices";
import { debounce } from "lodash";
import { useBuyers } from "../hooks/useBuyers";

export default function InvoiceFormDetailsPage() {
  const {
    form,
    invoiceNumberExists,
    setInvoiceNumberExists,
    isCheckingInvoiceNumber,
    setIsCheckingInvoiceNumber,
    isFetchingNextInvoiceNumber,
  } = useInvoice();
  const { control, watch } = form;
  const navigate = useNavigate();
  const { data: buyers = [], isLoading: isLoadingBuyers } = useBuyers();
  const selectedBuyer = form.getValues("buyer");
  const invoiceNumber = watch("invoiceNumber");

  // Debounced invoice number validation
  const debouncedCheckInvoiceNumber = useCallback(
    debounce(async (invoiceNumberValue: string) => {
      if (!invoiceNumberValue || invoiceNumberValue.trim() === "") {
        setInvoiceNumberExists(false);
        setIsCheckingInvoiceNumber(false);
        return;
      }

      try {
        const result = await checkInvoiceNumber(invoiceNumberValue);
        setInvoiceNumberExists(result.exists);
      } catch (err) {
        console.error("Failed to check invoice number:", err);
      } finally {
        setIsCheckingInvoiceNumber(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (!invoiceNumber || invoiceNumber.trim() === "") {
      setInvoiceNumberExists(false);
      setIsCheckingInvoiceNumber(false);
      return;
    }

    setIsCheckingInvoiceNumber(true);
    debouncedCheckInvoiceNumber(invoiceNumber);

    return () => {
      debouncedCheckInvoiceNumber.cancel();
    };
  }, [invoiceNumber, debouncedCheckInvoiceNumber]);
  return (
    <>
      <Stack spacing={2}>
        <Controller
          name="invoiceNumber"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              label="Invoice Number"
              fullWidth
              {...field}
              disabled={isFetchingNextInvoiceNumber}
              onChange={(e) => {
                field.onChange(e);
                if (error) {
                  form.clearErrors("invoiceNumber");
                }
              }}
              error={invoiceNumberExists || !!error}
              helperText={
                error?.message ||
                (invoiceNumberExists
                  ? "This invoice number is already in use"
                  : "")
              }
              slotProps={{
                input: {
                  endAdornment: (isCheckingInvoiceNumber || isFetchingNextInvoiceNumber) ? (
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
            <Controller
              name="buyer"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  options={buyers}
                  getOptionLabel={(option) => option.name}
                  getOptionKey={(option) => option.id}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  loading={isLoadingBuyers}
                  value={field.value}
                  onChange={(_, value) => {
                    field.onChange(value);
                    if (error) {
                      form.clearErrors("buyer");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Buyer"
                      error={!!error}
                      helperText={error?.message}
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoadingBuyers ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                  sx={{ flex: 1 }}
                />
              )}
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
