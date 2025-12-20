import { Drawer, Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { type ProductFormData } from "../api/products";
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
} from "../hooks/useProducts";
import ProductForm from "./ProductForm";

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  productId?: string;
}

export default function ProductDrawer({
  open,
  onClose,
  mode,
  productId,
}: ProductDrawerProps) {
  const [error, setError] = useState<string | null>(null);

  const { data: product, isLoading: isFetching } = useProduct(
    mode === "edit" ? productId : undefined
  );
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const isLoading = createProductMutation.isPending || updateProductMutation.isPending;

  const initialData: ProductFormData | undefined =
    mode === "edit" && product
      ? {
          name: product.name,
          hsn: product.hsn,
          defaultPrice: product.defaultPrice,
          defaultUnit: product.defaultUnit,
          category: product.category,
        }
      : undefined;

  const handleSubmit = async (data: ProductFormData) => {
    setError(null);

    try {
      if (mode === "create") {
        await createProductMutation.mutateAsync(data);
      } else if (mode === "edit" && productId) {
        await updateProductMutation.mutateAsync({ id: productId, data });
      }

      // Close drawer on success
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          `An error occurred while ${mode === "create" ? "creating" : "updating"} the product`
      );
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
