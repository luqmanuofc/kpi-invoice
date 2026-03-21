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
  topBuyers: Array<{ name: string; total: number }>;
  topProduct: { name: string; qty: number } | null;
  revenueChart: Array<{ month: string; revenue: number }>;
}

function formatIndian(value: number): string {
  if (value >= 1_00_00_000) return `${(value / 1_00_00_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(1).replace(/\.0$/, "")} L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")} K`;
  return value.toLocaleString("en-IN");
}

function RevenueBarChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-3 h-20 w-full">
      {data.map((d) => {
        const heightPct = Math.round((d.revenue / max) * 100);
        const label = dayjs(d.month + "-01").format("MMM");
        const isLast = d === data[data.length - 1];
        return (
          <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs text-muted-foreground">
              ₹{formatIndian(d.revenue)}
            </span>
            <div className="w-full flex items-end" style={{ height: "48px" }}>
              <div
                className={`w-full rounded-sm transition-all ${isLast ? "bg-primary" : "bg-primary/30"}`}
                style={{ height: `${heightPct}%`, minHeight: d.revenue > 0 ? "4px" : "0" }}
              />
            </div>
            <span className="text-xs font-medium">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(dayjs());
  const { exportToExcel, isExporting } = useExportMonthlyCSV();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInvoices: 0,
    totalRevenue: 0,
    topBuyers: [],
    topProduct: null,
    revenueChart: [],
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
          topBuyers: data.topBuyers ?? [],
          topProduct: data.topProduct,
          revenueChart: data.revenueChart ?? [],
        });
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard metrics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedMonth]);

  if (error) {
    return (
      <div className="p-4 md:p-8 w-full h-full flex justify-center items-center">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full h-full">
      <div className="flex flex-col md:flex-row md:justify-between w-full gap-4 mb-8">
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

          <Card className="gap-2 w-full md:max-w-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top Buyers — {selectedMonth?.format("MMMM YYYY")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topBuyers.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {metrics.topBuyers.map((buyer, i) => {
                    const max = metrics.topBuyers[0].total;
                    const widthPct = Math.round((buyer.total / max) * 100);
                    return (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="truncate font-medium max-w-[60%]" title={buyer.name}>
                            {buyer.name}
                          </span>
                          <span className="text-muted-foreground text-xs shrink-0">
                            ₹{formatIndian(buyer.total)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${i === 0 ? "bg-primary" : "bg-primary/40"}`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-2 w-full md:max-w-75">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topProduct ? (
                <>
                  <div className="text-2xl font-bold truncate" title={metrics.topProduct.name}>
                    {metrics.topProduct.name}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {metrics.topProduct.qty.toLocaleString("en-IN")} units in {selectedMonth?.format("MMMM YYYY")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>

          {metrics.revenueChart.length > 0 && (
            <Card className="gap-2 w-full md:max-w-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue — Last 3 Months
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueBarChart data={metrics.revenueChart} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
