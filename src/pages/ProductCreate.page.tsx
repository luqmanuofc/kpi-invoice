import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { createProduct, type ProductFormData } from "../api/products";
import ProductForm from "../components/ProductForm";

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createProduct(data);
      console.log("Product created:", result);

      // Navigate back to return URL or products list after successful creation
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate("/products");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProductForm
      mode="create"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}
