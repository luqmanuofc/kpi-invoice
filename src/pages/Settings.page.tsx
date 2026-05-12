import { useState } from "react";
import { Loader2, Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import type { BankAccount } from "../api/settings";
import BankDrawer from "../settings/BankDrawer";

export default function SettingsPage() {
  const { data: settings, isLoading, error } = useSettings();
  const updateMutation = useUpdateSettings();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const banks = settings?.bankAccounts ?? [];

  const handleCreateClick = () => {
    setDrawerMode("create");
    setEditingIndex(null);
    setDrawerOpen(true);
  };

  const handleEditClick = (idx: number) => {
    setDrawerMode("edit");
    setEditingIndex(idx);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingIndex(null);
  };

  const handleDrawerSubmit = async (data: BankAccount) => {
    let nextBanks: BankAccount[];
    if (drawerMode === "create") {
      nextBanks = [...banks, data];
    } else if (editingIndex !== null) {
      nextBanks = banks.map((b, i) => (i === editingIndex ? data : b));
    } else {
      return;
    }
    await updateMutation.mutateAsync({ bankAccounts: nextBanks });
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const editingBank = editingIndex !== null ? banks[editingIndex] : undefined;

  return (
    <div className="w-full h-full p-4 md:p-8">
      <div className="flex md:justify-between gap-2 items-center mb-2">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Button variant="outline" size="sm" onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-1" /> Add Bank
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Manage bank accounts that appear in the Payment Information section of
        invoices. Click edit to and toggle visibility to show or hide a bank.
      </p>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error instanceof Error ? error.message : "Failed to load settings"}
        </Alert>
      )}

      {banks.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed rounded-lg">
          <p className="text-base text-muted-foreground font-medium">
            No bank accounts configured.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {banks.map((bank, idx) => (
            <Card key={idx} className="w-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{bank.bank}</CardTitle>
                  <div
                    className={
                      "flex items-center gap-1 text-xs " +
                      (bank.visible
                        ? "text-foreground"
                        : "text-muted-foreground")
                    }
                  >
                    {bank.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    <span>{bank.visible ? "Visible" : "Hidden"}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grow space-y-2">
                <p className="text-sm text-muted-foreground text-left">
                  <strong>Branch:</strong> {bank.branch}
                </p>
                <p className="text-sm text-muted-foreground text-left">
                  <strong>Account No:</strong> {bank.accountNo}
                </p>
                <p className="text-sm text-muted-foreground text-left">
                  <strong>IFSC:</strong> {bank.ifsc}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-0">
                <Button size="sm" onClick={() => handleEditClick(idx)}>
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <BankDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        mode={drawerMode}
        bank={editingBank}
        onSubmit={handleDrawerSubmit}
      />
    </div>
  );
}
