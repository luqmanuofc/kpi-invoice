import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDownIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Buyer } from "@/api/buyers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import BuyerDrawer from "@/buyer/BuyerDrawer";
import { useBuyers } from "@/hooks/useBuyers";

interface BuyerSelectProps {
  value: Buyer | null;
  onChange: (buyer: Buyer) => void;
  onClear: () => void;
  error?: string;
  disabled?: boolean;
  showAddNew?: boolean;
}

export function BuyerSelect({
  value,
  onChange,
  onClear,
  error,
  disabled = false,
}: BuyerSelectProps) {
  const { data: buyers = [], isLoading, refetch } = useBuyers();
  const [open, setOpen] = useState(false);
  const [addNewOpen, setAddNewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (open && isDesktop && inputRef.current) {
      // Small delay to ensure focus happens after dialog opens
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, isDesktop]);

  const filteredBuyers = buyers.filter((buyer) =>
    buyer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBuyer = (buyer: Buyer) => {
    onChange(buyer);
    setOpen(false);
    setSearchQuery("");
  };

  const buyerListContent = isLoading ? (
    <div className="p-4 text-sm text-muted-foreground">Loading buyers...</div>
  ) : buyers.length === 0 ? (
    <div className="p-4 text-sm text-muted-foreground">No buyers found</div>
  ) : filteredBuyers.length === 0 ? (
    <div className="p-4 text-sm text-muted-foreground">
      No buyers match your search
    </div>
  ) : (
    <div className="grid">
      {filteredBuyers.map((buyer) => (
        <button
          key={buyer.id}
          onClick={() => handleSelectBuyer(buyer)}
          className={cn(
            "px-4 py-2 text-left text-sm hover:bg-accent transition-colors",
            value?.id === buyer.id && "bg-accent"
          )}
        >
          {buyer.name}
        </button>
      ))}
    </div>
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
  };

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center gap-2 h-9 px-3 py-2 text-sm border border-input rounded-md bg-transparent">
          <span className="flex-1 text-left" onClick={() => setOpen(true)}>
            {value.name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2"
            onClick={handleClear}
            disabled={disabled || isLoading}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          id="buyer"
          onClick={() => setOpen(true)}
          className={cn(
            "w-full justify-between font-normal text-muted-foreground",
            error && "border-red-500"
          )}
          disabled={disabled || isLoading}
        >
          Select or add a buyer
          <ChevronDownIcon />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="h-[calc(100%-5rem)] max-w-[calc(100%-2.5rem)] w-full flex flex-col top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          onOpenAutoFocus={(e) => {
            if (!isDesktop) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Buyers</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b flex flex-col gap-2">
              <Input
                ref={inputRef}
                placeholder="Search buyers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
                autoFocus={isDesktop}
              />
              <div className="text-sm text-muted-foreground flex justify-between">
                <div />
                <text
                  onClick={() => setAddNewOpen(true)}
                  className="cursor-pointer hover:underline transition-all duration-300"
                >
                  Add new buyer
                </text>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">{buyerListContent}</div>
          </div>
        </DialogContent>
      </Dialog>

      {error && <p className="text-sm text-red-500 mt-1 text-left">{error}</p>}
      <BuyerDrawer
        open={addNewOpen}
        mode="create"
        onClose={() => setAddNewOpen(false)}
        onSuccess={(buyer) => {
          refetch();
          if (buyer) {
            handleSelectBuyer(buyer);
          }
          setAddNewOpen(false);
        }}
      />
    </div>
  );
}
