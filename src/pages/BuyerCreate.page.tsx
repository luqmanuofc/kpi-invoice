import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createBuyer, type BuyerFormData } from "../api/buyers";
import BuyerForm from "../components/BuyerForm";

export default function BuyerCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: BuyerFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createBuyer(data);
      console.log("Buyer created:", result);

      // Navigate back to buyers list after successful creation
      navigate("/buyer");
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the buyer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BuyerForm
      mode="create"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}
