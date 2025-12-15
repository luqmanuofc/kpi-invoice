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
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  getProducts,
  type Product,
  type ProductCategory,
} from "../api/products";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProducts();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
    navigate(`/products/${productId}`);
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
          onClick={() => navigate("/products/create")}
        >
          Add Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {CATEGORIES.map((category) => (
        <Box key={category} sx={{ mb: 5 }}>
          <Typography
            variant="h6"
            fontWeight={400}
            align="left"
            sx={{
              mb: 3,
              pb: 1,
              width: "100%",
              borderColor: "primary.main",
              display: "inline-block",
            }}
          >
            {CATEGORY_LABELS[category]}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fill, minmax(250px, 1fr))",
              },
              gap: 3,
              justifyItems: "start",
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
        </Box>
      ))}
    </Box>
  );
}
