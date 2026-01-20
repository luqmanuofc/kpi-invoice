import { type Product, type ProductCategory } from "../api/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  PVC_PIPE: "PVC Pipe",
  PVC_BEND: "PVC Bend",
  PVC_CHANNEL: "PVC Channel",
  WIRE: "Wire",
  ELECTRICAL_ACCESSORY: "Electrical Accessory",
};

interface ProductCardProps {
  product: Product;
  onClick: (productId: string) => void;
  showCategory?: boolean;
}

export default function ProductCard({
  product,
  onClick,
  showCategory = false,
}: ProductCardProps) {
  return (
    <Card onClick={() => onClick(product.id)}>
      <CardContent>
        <h3 className="text-lg mb-3 text-center">{product.name}</h3>
        <div className="space-y-2 text-sm text-left">
          {showCategory && (
            <div className="text-muted-foreground">
              Category:{" "}
              <Badge variant="secondary">
                {CATEGORY_LABELS[product.category]}
              </Badge>
            </div>
          )}
          <div className="text-muted-foreground">
            HSN Code: <Badge variant="outline">{product.hsn}</Badge>
          </div>
          <div className="text-muted-foreground">
            Rate: ₹
            {product.defaultPrice.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-0">
        <Button
          size="sm"
          variant="default"
          onClick={(e) => {
            e.stopPropagation();
            onClick(product.id);
          }}
        >
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}
