import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { ProductCategory, Product } from "../api/products";
import { useProducts } from "../hooks/useProducts";

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
  const { data: products = [], isLoading: loading } = useProducts();
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (open) {
      setSelectedProductIds(new Set());
    }
  }, [open]);

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Products to Invoice</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <Accordion type="multiple" className="w-full">
              {Object.entries(productsByCategory).map(([category, items]) => {
                const categoryKey = category as ProductCategory;

                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="">
                      {CATEGORY_LABELS[categoryKey]}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-2">
                        {items.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-start space-x-3 py-2"
                          >
                            <Checkbox
                              id={product.id}
                              checked={selectedProductIds.has(product.id)}
                              onCheckedChange={() =>
                                handleToggleProduct(product.id)
                              }
                            />
                            <Label
                              htmlFor={product.id}
                              className="flex flex-col text-left cursor-pointer space-y-1 leading-none"
                            >
                              <div className="font-medium w-full m-0">
                                {product.name + " "}
                                <span className="text-sm w-full text-muted-foreground">
                                  {product.defaultPrice.toLocaleString(
                                    "en-IN",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            {products.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-4">
                No products available. Please add products first.
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddProducts}
            disabled={selectedProductIds.size === 0}
          >
            Add {selectedProductIds.size > 0 && `(${selectedProductIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
