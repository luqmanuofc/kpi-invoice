import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getProductById,
  updateProduct,
  type ProductFormData,
} from "../api/products";
import ProductForm from "../components/ProductForm";

export default function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<ProductFormData | undefined>();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID is missing");
        setIsFetching(false);
        return;
      }

      try {
        setIsFetching(true);
        setError(null);
        const product = await getProductById(id);
        setInitialData({
          name: product.name,
          hsn: product.hsn,
          defaultPrice: product.defaultPrice,
          category: product.category,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setIsFetching(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (data: ProductFormData) => {
    if (!id) {
      setError("Product ID is missing");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateProduct(id, data);
      console.log("Product updated:", result);

      // Navigate back to return URL or products list after successful update
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate("/products");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProductForm
      mode="edit"
      initialData={initialData}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
    />
  );
}
