import { useForm, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
} from "@mui/material";
import { useEffect } from "react";
import type { ProductFormData, ProductCategory } from "../api/products";

const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "PVC_PIPE", label: "PVC Pipe" },
  { value: "PVC_BEND", label: "PVC Bend" },
  { value: "PVC_CHANNEL", label: "PVC Channel" },
  { value: "WIRE", label: "Wire" },
  { value: "ELECTRICAL_ACCESSORY", label: "Electrical Accessory" },
];

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: ProductFormData;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: string | null;
}

export default function ProductForm({
  mode,
  initialData,
  onSubmit,
  isLoading = false,
  isFetching = false,
  error = null,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ProductFormData>({
    defaultValues: initialData || {
      name: "",
      category: "" as ProductCategory,
      hsn: "",
      defaultPrice: 0,
      defaultUnit: "",
    },
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

          <Controller
            name="category"
            control={control}
            rules={{ required: "Category is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Category"
                select
                error={!!errors.category}
                helperText={errors.category?.message}
                fullWidth
                SelectProps={{
                  MenuProps: {
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                  },
                }}
                inputProps={{
                  sx: { textAlign: "left" },
                }}
              >
                {PRODUCT_CATEGORIES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
            label="HSN Code"
            {...register("hsn")}
            error={!!errors.hsn}
            helperText={errors.hsn?.message}
            fullWidth
          />

          <TextField
            label="Default Price"
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            {...register("defaultPrice", {
              required: "Default price is required",
              valueAsNumber: true,
              min: { value: 0, message: "Price must be positive" },
            })}
            error={!!errors.defaultPrice}
            helperText={errors.defaultPrice?.message}
            fullWidth
          />

          <TextField
            label="Default Unit"
            {...register("defaultUnit", { required: "Default unit is required" })}
            error={!!errors.defaultUnit}
            helperText={errors.defaultUnit?.message}
            fullWidth
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
