import { useNavigate, useSearchParams } from "react-router-dom";
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
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    defaultValues: initialData,
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleBack = () => {
    if (returnUrl) {
      navigate(returnUrl);
    } else {
      navigate("/products");
    }
  };

  const title = mode === "create" ? "New Product" : "Edit Product";
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
          href={returnUrl || "/products"}
          onClick={(e) => {
            e.preventDefault();
            if (returnUrl) {
              navigate(returnUrl);
            } else {
              navigate("/products");
            }
          }}
        >
          {returnUrl ? "Back" : "Products"}
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
            label="Category"
            select
            {...register("category", { required: "Category is required" })}
            error={!!errors.category}
            helperText={errors.category?.message}
            fullWidth
          >
            {PRODUCT_CATEGORIES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

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
