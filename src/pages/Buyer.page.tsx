import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import BuyerDrawer from "../buyer/BuyerDrawer";
import { useBuyers } from "../hooks/useBuyers";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import SearchBox from "@/components/SearchBox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BuyerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: buyers = [], isLoading, error, refetch } = useBuyers();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  // Handle URL-based drawer state
  useEffect(() => {
    const path = location.pathname;

    if (path === "/buyer/create") {
      setDrawerMode("create");
      setSelectedBuyerId(undefined);
      setDrawerOpen(true);
    } else if (path.match(/^\/buyer\/([^/]+)\/edit$/)) {
      const buyerId = path.split("/")[2];
      setDrawerMode("edit");
      setSelectedBuyerId(buyerId);
      setDrawerOpen(true);
    } else if (path === "/buyer" || path === "/buyer/") {
      setDrawerOpen(false);
    }
  }, [location.pathname]);

  const handleCreateClick = () => {
    navigate("/buyer/create");
  };

  const handleEditClick = (buyerId: string) => {
    navigate(`/buyer/${buyerId}/edit`);
  };

  const handleDrawerClose = () => {
    navigate("/buyer");
  };

  const handleDrawerSuccess = () => {
    refetch();
  };

  const handleViewInvoicesClick = (buyerId: string) => {
    navigate(`/invoices?buyerId=${buyerId}`);
  };

  // Fuzzy/elastic search filter
  const filteredBuyers = useMemo(() => {
    if (!searchQuery.trim()) return buyers;

    const query = searchQuery.toLowerCase().trim();
    return buyers.filter((buyer) => {
      const searchableFields = [
        buyer.name,
        buyer.address,
        buyer.gstin || "",
        buyer.phone || "",
      ].map((field) => field.toLowerCase());

      // Check if any field contains the search query (partial matching)
      return searchableFields.some((field) => field.includes(query));
    });
  }, [buyers, searchQuery]);

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
          placeholder="Search Buyer"
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <Button variant="outline" size="sm" onClick={handleCreateClick}>
          Create
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error instanceof Error ? error.message : "Failed to load buyers"}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredBuyers.map((buyer) => (
          <Card
            key={buyer.id}
            className="w-full flex flex-col"
            onClick={() => handleEditClick(buyer.id)}
          >
            <CardHeader>
              <CardTitle>{buyer.name}</CardTitle>
            </CardHeader>
            <CardContent className="grow space-y-2">
              <p className="text-sm text-muted-foreground text-left">
                <strong>Address:</strong> {buyer.address}
              </p>
              <p className="text-sm text-muted-foreground text-left">
                <strong>GSTIN:</strong> {buyer.gstin || ""}
              </p>
              <p className="text-sm text-muted-foreground text-left">
                <strong>Phone:</strong> {buyer.phone || ""}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewInvoicesClick(buyer.id)}
              >
                View Invoices
              </Button>
              <Button size="sm" onClick={() => handleEditClick(buyer.id)}>
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <BuyerDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        mode={drawerMode}
        buyerId={selectedBuyerId}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
