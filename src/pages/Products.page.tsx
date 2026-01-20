import { Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { type Product, type ProductCategory } from "../api/products";
import { useProducts } from "../hooks/useProducts";
import ProductDrawer from "../components/ProductDrawer";
import ProductCard from "../components/ProductCard";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SearchBox from "@/components/SearchBox";

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
  const [selectedProductId, setSelectedProductId] = useState<
    string | undefined
  >();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fuzzy/elastic search filter
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      const searchableFields = [
        product.name,
        product.hsn,
        CATEGORY_LABELS[product.category],
        product.defaultPrice.toString(),
      ].map((field) => field.toLowerCase());

      // Check if any field contains the search query (partial matching)
      return searchableFields.some((field) => field.includes(query));
    });
  }, [products, searchQuery]);

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

  if (isLoading) {
    return (
      <div className="w-full h-hull flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-8">
      <div className="flex md:justify-between gap-2 items-center mb-8">
        <SearchBox
          placeholder="Search Products"
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <Button variant="outline" size="sm" onClick={handleCreateClick}>
          Create
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error.message || "Failed to load products"}
        </Alert>
      )}

      {searchQuery.trim() && (
        <div className="mb-8">
          <h2 className="text-lg font-normal mb-4">
            Search Results{" "}
            <span className="text-lg text-muted-foreground">
              ({filteredProducts.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
                showCategory
              />
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full p-8 text-center border-2 border-dashed rounded-lg">
                <p className="text-base text-muted-foreground font-medium">
                  No products found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Accordion type="multiple" className="w-full">
        {CATEGORIES.map((category) => (
          <AccordionItem key={category} value={category} className="mb-6">
            <AccordionTrigger className="flex items-center gap-2 mb-4 hover:no-underline">
              <h2 className="text-lg font-normal">
                {CATEGORY_LABELS[category]}{" "}
                <span className="text-lg text-muted-foreground">
                  ({productsByCategory[category]?.length || 0})
                </span>
              </h2>
            </AccordionTrigger>

            <AccordionContent className="h-fit">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4">
                {productsByCategory[category]?.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={handleProductClick}
                  />
                ))}

                {(!productsByCategory[category] ||
                  productsByCategory[category].length === 0) && (
                  <div className="col-span-full p-8 text-center border-2 border-dashed rounded-lg">
                    <p className="text-base text-muted-foreground font-medium">
                      No products in this category yet
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <ProductDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        mode={drawerMode}
        productId={selectedProductId}
      />
    </div>
  );
}
