import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Stack,
  CircularProgress,
  Box,
  Divider,
  IconButton,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { getProducts } from "../api/products";
import type { ProductCategory, Product } from "../api/products";

interface AddProductsModalProps {
  open: boolean;
  onClose: () => void;
  onAddProducts: (products: Product[]) => void;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  PVC_PIPE: "PVC Pipes",
  PVC_BEND: "PVC Bends",
  PVC_CHANNEL: "PVC Channels",
  WIRE: "Wires",
  ELECTRICAL_ACCESSORY: "Electrical Accessories",
};

export default function AddProductsModal({
  open,
  onClose,
  onAddProducts,
}: AddProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [expandedCategories, setExpandedCategories] = useState<
    Set<ProductCategory>
  >(new Set());

  useEffect(() => {
    if (open) {
      loadProducts();
      setSelectedProductIds(new Set());
    }
  }, [open]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleToggleCategory = (category: ProductCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleAddProducts = () => {
    const selectedProducts = products.filter((p) =>
      selectedProductIds.has(p.id)
    );
    onAddProducts(selectedProducts);
    onClose();
  };

  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<ProductCategory, Product[]>);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Products to Invoice</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            {Object.entries(productsByCategory).map(([category, items]) => {
              const categoryKey = category as ProductCategory;
              const isExpanded = expandedCategories.has(categoryKey);

              return (
                <Box key={category}>
                  <Box
                    display="flex"
                    alignItems="center"
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleToggleCategory(categoryKey)}
                  >
                    <IconButton size="small" sx={{ mr: 1 }}>
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary"
                      sx={{ flexGrow: 1 }}
                    >
                      {CATEGORY_LABELS[categoryKey]}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  {isExpanded && (
                    <Stack spacing={0.5} sx={{ pl: 5 }}>
                      {items.map((product) => (
                        <FormControlLabel
                          key={product.id}
                          control={
                            <Checkbox
                              checked={selectedProductIds.has(product.id)}
                              onChange={() => handleToggleProduct(product.id)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1">
                                {product.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                HSN: {product.hsn} | Rate: ₹
                                {product.defaultPrice}
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              );
            })}
            {products.length === 0 && !loading && (
              <Typography color="text.secondary" align="center">
                No products available. Please add products first.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAddProducts}
          variant="contained"
          disabled={selectedProductIds.size === 0}
        >
          Add {selectedProductIds.size > 0 && `(${selectedProductIds.size})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
