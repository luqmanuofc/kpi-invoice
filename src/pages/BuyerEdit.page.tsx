import { useNavigate, useParams } from "react-router-dom";
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
import { useState, useEffect } from "react";
import {
  getBuyerById,
  updateBuyer,
  type BuyerFormData,
} from "../api/buyers";

export default function BuyerEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BuyerFormData>();

  useEffect(() => {
    const fetchBuyer = async () => {
      if (!id) {
        setError("Buyer ID is missing");
        setIsFetching(false);
        return;
      }

      try {
        setIsFetching(true);
        setError(null);
        const buyer = await getBuyerById(id);
        reset({
          name: buyer.name,
          address: buyer.address,
          gstin: buyer.gstin || "",
          phone: buyer.phone || "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load buyer");
      } finally {
        setIsFetching(false);
      }
    };

    fetchBuyer();
  }, [id, reset]);

  const onSubmit = async (data: BuyerFormData) => {
    if (!id) {
      setError("Buyer ID is missing");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateBuyer(id, data);
      console.log("Buyer updated:", result);

      // Navigate back to buyers list after successful update
      navigate("/buyer");
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the buyer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/buyer");
  };

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
        <Typography>Edit</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 4 }}>
        Edit Buyer
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
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
