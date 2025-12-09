import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getBuyerById,
  updateBuyer,
  type BuyerFormData,
} from "../api/buyers";
import BuyerForm from "../components/BuyerForm";

export default function BuyerEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<BuyerFormData | undefined>();

  useEffect(() => {
    const fetchBuyer = async () => {
      if (!id) {
        setError("Buyer ID is missing");
        setIsFetching(false);
        return;
      }

      try {
        setIsFetching(true);
        setError(null);
        const buyer = await getBuyerById(id);
        setInitialData({
          name: buyer.name,
          address: buyer.address,
          gstin: buyer.gstin || "",
          phone: buyer.phone || "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load buyer");
      } finally {
        setIsFetching(false);
      }
    };

    fetchBuyer();
  }, [id]);

  const handleSubmit = async (data: BuyerFormData) => {
    if (!id) {
      setError("Buyer ID is missing");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateBuyer(id, data);
      console.log("Buyer updated:", result);

      // Navigate back to return URL or buyers list after successful update
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate("/buyer");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the buyer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BuyerForm
      mode="edit"
      initialData={initialData}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
    />
  );
}
