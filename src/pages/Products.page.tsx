import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  IconButton,
  Collapse,
} from "@mui/material";
import { Add, ExpandMore } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { type Product, type ProductCategory } from "../api/products";
import { useProducts } from "../hooks/useProducts";
import ProductDrawer from "../components/ProductDrawer";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  PVC_PIPE: "PVC Pipe",
  PVC_BEND: "PVC Bend",
  PVC_CHANNEL: "PVC Channel",
  WIRE: "Wire",
  ELECTRICAL_ACCESSORY: "Electrical Accessory",
};

const CATEGORIES: ProductCategory[] = [
  "PVC_PIPE",
  "PVC_BEND",
  "PVC_CHANNEL",
  "WIRE",
  "ELECTRICAL_ACCESSORY",
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: products = [], isLoading, error } = useProducts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [expandedCategories, setExpandedCategories] = useState<Record<ProductCategory, boolean>>({
    PVC_PIPE: false,
    PVC_BEND: false,
    PVC_CHANNEL: false,
    WIRE: false,
    ELECTRICAL_ACCESSORY: false,
  });

  // Handle URL-based drawer state
  useEffect(() => {
    const path = location.pathname;

    if (path === "/products/create") {
      setDrawerMode("create");
      setSelectedProductId(undefined);
      setDrawerOpen(true);
    } else if (path.match(/^\/products\/([^/]+)\/edit$/)) {
      const productId = path.split("/")[2];
      setDrawerMode("edit");
      setSelectedProductId(productId);
      setDrawerOpen(true);
    } else if (path === "/products" || path === "/products/") {
      setDrawerOpen(false);
    }
  }, [location.pathname]);

  const productsByCategory = useMemo(() => {
    const categorized = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<ProductCategory, Product[]>);

    // Sort products alphabetically within each category
    Object.keys(categorized).forEach((category) => {
      categorized[category as ProductCategory].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });

    return categorized;
  }, [products]);

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}/edit`);
  };

  const handleCreateClick = () => {
    navigate("/products/create");
  };

  const handleDrawerClose = () => {
    navigate("/products");
  };

  const toggleCategory = (category: ProductCategory) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (isLoading) {
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight={400}>
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateClick}
        >
          Add Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message || "Failed to load products"}
        </Alert>
      )}

      {CATEGORIES.map((category) => (
        <Box key={category} sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
              cursor: "pointer",
            }}
            onClick={() => toggleCategory(category)}
          >
            <IconButton
              sx={{
                transform: expandedCategories[category] ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
              size="small"
            >
              <ExpandMore />
            </IconButton>
            <Typography variant="h6" fontWeight={400}>
              {CATEGORY_LABELS[category]}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({productsByCategory[category]?.length || 0})
            </Typography>
          </Box>

          <Collapse in={expandedCategories[category]} timeout="auto">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(auto-fill, minmax(250px, 1fr))",
                },
                gap: 3,
                justifyItems: "start",
                ml: 6,
              }}
            >
            {productsByCategory[category]?.map((product) => (
              <Card
                key={product.id}
                sx={{
                  width: "100%",
                  maxWidth: 280,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "grey.200",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    transform: "translateY(-4px)",
                    bgcolor: "background.paper",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleProductClick(product.id)}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <CardContent sx={{ p: 3, flex: 1 }}>
                    <Typography
                      variant="h6"
                      align="left"
                      sx={{
                        fontWeight: 400,
                        mb: 2,
                        fontSize: "1.1rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        HSN CODE
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {product.hsn}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        mt: 2,
                        p: 1,
                        borderRadius: 1.5,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          color: "primary.main",
                          fontWeight: 500,
                        }}
                      >
                        ₹
                        {product.defaultPrice.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}

            {(!productsByCategory[category] ||
              productsByCategory[category].length === 0) && (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  gridColumn: "1 / -1",
                  width: "100%",
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  fontWeight={500}
                >
                  No products in this category yet
                </Typography>
              </Box>
            )}
          </Box>
          </Collapse>
        </Box>
      ))}

      <ProductDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        mode={drawerMode}
        productId={selectedProductId}
      />
    </Box>
  );
}
