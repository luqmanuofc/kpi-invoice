import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExportMonthlyCSV } from "@/hooks/useExportMonthlyCSV";
import { useDashboardMetrics } from "@/hooks/useDashboard";
import { formatIndian } from "@/utils/format";

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
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(dayjs());
  const { exportToExcel, isExporting } = useExportMonthlyCSV();
  const monthParam = selectedMonth?.format("YYYY-MM");
  const {
    data,
    isLoading,
    error: errorObj,
  } = useDashboardMetrics(monthParam);
  const metrics = {
    totalInvoices: data?.totalInvoices ?? 0,
    totalRevenue: data?.totalRevenue ?? 0,
    topBuyers: data?.topBuyers ?? [],
    revenueChart: data?.revenueChart ?? [],
    productRevenue: data?.productRevenue ?? [],
  };
  const error = errorObj
    ? errorObj instanceof Error
      ? errorObj.message
      : "Failed to load dashboard metrics"
    : null;
  const [buyersExpanded, setBuyersExpanded] = useState(false);
  const [productsExpanded, setProductsExpanded] = useState(false);

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

  if (error) {
    return (
      <div className="p-4 md:p-8 w-full h-full md:min-h-[calc(100vh-4rem)] flex justify-center items-center">
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
        <div className="w-full h-full md:min-h-[calc(100vh-4rem)] flex justify-center items-center">
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
                  {(buyersExpanded ? metrics.topBuyers : metrics.topBuyers.slice(0, 5)).map((buyer, i) => {
                    const max = metrics.topBuyers[0].total;
                    const widthPct = Math.round((buyer.total / max) * 100);
                    return (
                      <button
                        key={buyer.id}
                        onClick={() => navigate(`/buyer/${buyer.id}`)}
                        className="flex flex-col gap-1 text-left group cursor-pointer"
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span
                            className="truncate font-medium max-w-[60%] group-hover:text-primary group-hover:underline"
                            title={buyer.name}
                          >
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
                      </button>
                    );
                  })}
                  {metrics.topBuyers.length > 5 && (
                    <button
                      onClick={() => setBuyersExpanded((v) => !v)}
                      className="text-xs text-primary hover:underline text-left mt-1"
                    >
                      {buyersExpanded ? "View less" : `View ${metrics.topBuyers.length - 5} more`}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>

          {metrics.productRevenue.length > 0 && (
            <Card className="gap-2 w-full md:max-w-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue by Product — {selectedMonth?.format("MMMM YYYY")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {(productsExpanded ? metrics.productRevenue : metrics.productRevenue.slice(0, 5)).map((product, i) => {
                    const max = metrics.productRevenue[0].revenue;
                    const widthPct = Math.round((product.revenue / max) * 100);
                    return (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="truncate font-medium max-w-[55%]" title={product.name}>
                            {product.name}
                          </span>
                          <span className="text-muted-foreground text-xs shrink-0 flex items-center gap-2">
                            <span>
                              {formatIndian(product.qty)} {product.unit}
                            </span>
                            <span className="text-muted-foreground/50">·</span>
                            <span>₹{formatIndian(product.revenue)}</span>
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
                  {metrics.productRevenue.length > 5 && (
                    <button
                      onClick={() => setProductsExpanded((v) => !v)}
                      className="text-xs text-primary hover:underline text-left mt-1"
                    >
                      {productsExpanded ? "View less" : `View ${metrics.productRevenue.length - 5} more`}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
