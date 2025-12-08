import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Typography,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
  const navigate = useNavigate();

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

  const handleBack = () => {
    navigate("/buyer");
  };

  const title = mode === "create" ? "New Buyer" : "Edit Buyer";
  const breadcrumbText = mode === "create" ? "New" : "Edit";
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
    <Box sx={{ margin: "2rem" }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/buyer"
          onClick={(e) => {
            e.preventDefault();
            navigate("/buyer");
          }}
        >
          Buyers
        </Link>
        <Typography>{breadcrumbText}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 4 }}>
        {title}
      </Typography>

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
            {...register("phone")}
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
            {...register("gstin")}
            error={!!errors.gstin}
            helperText={errors.gstin?.message}
            fullWidth
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 4,
          }}
        >
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            disabled={isLoading}
          >
            Back
          </Button>

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
