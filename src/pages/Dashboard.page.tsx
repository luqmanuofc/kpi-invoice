import { useState, useEffect } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { getDashboardMetrics } from "../api/dashboard";
import { Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExportMonthlyCSV } from "@/hooks/useExportMonthlyCSV";

interface DashboardMetrics {
  totalInvoices: number;
  totalRevenue: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    sales: number;
  }>;
}

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(dayjs());
  const { exportToExcel, isExporting } = useExportMonthlyCSV();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInvoices: 0,
    totalRevenue: 0,
    monthlyData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePreviousMonth = () => {
    setSelectedMonth((prev) => prev?.subtract(1, "month") || dayjs());
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => prev?.add(1, "month") || dayjs());
  };

  const handleExport = async () => {
    try {
      await exportToExcel(selectedMonth?.format("YYYY-MM") || "");
    } catch (error: any) {
      console.error("Export failed:", error);
      alert(`Failed to export Excel: ${error.message}`);
    }
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedMonth) return;

      try {
        setIsLoading(true);
        setError(null);

        const month = selectedMonth.format("YYYY-MM");
        const data = await getDashboardMetrics(month);

        setMetrics({
          totalInvoices: data.totalInvoices,
          totalRevenue: data.totalRevenue,
          monthlyData: [], // TODO: Populate with chart data when needed
        });
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard metrics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedMonth]);

  return (
    <div className="m-8 w-full h-full">
      <div className="flex flex-col md:flex-row md:justify-between w-full gap-4 p-1 mb-8">
        <div className="flex justify-center gap-4 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg min-w-50 text-center">
            {selectedMonth ? selectedMonth.format("MMMM YYYY") : "Select month"}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full md:w-auto"
        >
          {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
          {isExporting ? "Exporting..." : "Export Excel"}
        </Button>
      </div>
      {isLoading ? (
        <div className="w-full h-hull flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 w-full">
          <Card className="gap-2 w-full md:max-w-75">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₹{metrics.totalRevenue.toLocaleString("en-IN")}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                For {selectedMonth?.format("MMMM YYYY")}
              </p>
            </CardContent>
          </Card>
          <Card className="gap-2 w-full md:max-w-75">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics.totalInvoices.toLocaleString("en-IN")}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                For {selectedMonth?.format("MMMM YYYY")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
