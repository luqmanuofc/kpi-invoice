import { useForm } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useEffect } from "react";
import type { BuyerFormData } from "../api/buyers";

interface BuyerFormProps {
  mode: "create" | "edit";
  initialData?: BuyerFormData;
  onSubmit: (data: BuyerFormData) => Promise<void>;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: string | null;
}

export default function BuyerForm({
  mode,
  initialData,
  onSubmit,
  isLoading = false,
  isFetching = false,
  error = null,
}: BuyerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BuyerFormData>({
    defaultValues: initialData,
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const submitButtonText = mode === "create" ? "Create" : "Update";
  const loadingButtonText = mode === "create" ? "Creating..." : "Updating...";

  if (isFetching) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
            mb: 4,
          }}
        >
          <TextField
            label="Name"
            {...register("name", { required: "Name is required" })}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
          />

          <TextField
            label="Phone"
            {...register("phone", {
              validate: (value) => {
                if (!value || value.trim() === "") return true;
                if (/^\d{10}$/.test(value)) return true;
                return "Please enter a valid 10 digit phone number or leave empty";
              },
            })}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            fullWidth
          />

          <TextField
            label="Address"
            multiline
            rows={3}
            {...register("address", { required: "Address is required" })}
            error={!!errors.address}
            helperText={errors.address?.message}
            fullWidth
          />

          <TextField
            label="GSTIN"
            {...register("gstin", {
              validate: (value) => {
                if (!value || value.trim() === "") return true;
                if (value.length === 15) return true;
                return "Please enter a valid 15 character GSTIN or leave empty";
              },
            })}
            error={!!errors.gstin}
            helperText={errors.gstin?.message}
            fullWidth
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 4,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? loadingButtonText : submitButtonText}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
