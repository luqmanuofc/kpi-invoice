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
import { useState } from "react";
import { createBuyer, type BuyerFormData } from "../api/buyers";

export default function BuyerCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuyerFormData>();

  const onSubmit = async (data: BuyerFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createBuyer(data);
      console.log("Buyer created:", result);

      // Navigate back to buyers list after successful creation
      navigate("/buyer");
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the buyer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/buyer");
  };

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
        <Typography>New</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 4 }}>
        New Buyer
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
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
