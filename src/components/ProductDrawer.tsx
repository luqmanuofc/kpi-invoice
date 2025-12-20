import { Drawer, Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import {
  createProduct,
  updateProduct,
  getProductById,
  type ProductFormData,
} from "../api/products";
import ProductForm from "./ProductForm";

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  productId?: string;
  onSuccess?: () => void;
}

export default function ProductDrawer({
  open,
  onClose,
  mode,
  productId,
  onSuccess,
}: ProductDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<ProductFormData | undefined>();

  useEffect(() => {
    if (mode === "edit" && productId && open) {
      const fetchProduct = async () => {
        try {
          setIsFetching(true);
          setError(null);
          const product = await getProductById(productId);
          setInitialData({
            name: product.name,
            hsn: product.hsn,
            defaultPrice: product.defaultPrice,
            defaultUnit: product.defaultUnit,
            category: product.category,
          });
        } catch (err: any) {
          setError(err.message || "Failed to load product");
        } finally {
          setIsFetching(false);
        }
      };

      fetchProduct();
    } else if (mode === "create" && open) {
      // Reset form data when opening in create mode
      setInitialData(undefined);
      setError(null);
    }
  }, [mode, productId, open]);

  const handleSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "create") {
        await createProduct(data);
      } else if (mode === "edit" && productId) {
        await updateProduct(productId, data);
      }

      // Call success callback to refresh product list
      if (onSuccess) {
        onSuccess();
      }

      // Close drawer on success
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          `An error occurred while ${mode === "create" ? "creating" : "updating"} the product`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: "500px", md: "600px" },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">
            {mode === "create" ? "New Product" : "Edit Product"}
          </Typography>
          <IconButton onClick={handleClose} disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: "auto", p: 3 }}>
          <ProductForm
            mode={mode}
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
          />
        </Box>
      </Box>
    </Drawer>
  );
}
