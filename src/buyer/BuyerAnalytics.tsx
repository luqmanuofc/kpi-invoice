import dayjs from "dayjs";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIndian } from "@/utils/format";
import type { BuyerAnalytics as BuyerAnalyticsData } from "@/api/buyers";

function fiscalYearStartYear(): number {
  const today = dayjs();
  return today.month() >= 3 ? today.year() : today.year() - 1;
}

function fyLabel(startYear: number): string {
  return `FY ${startYear}-${String(startYear + 1).slice(-2)}`;
}

function fiscalYearLabel(): string {
  return fyLabel(fiscalYearStartYear());
}

function previousFiscalYearLabel(): string {
  return fyLabel(fiscalYearStartYear() - 1);
}

function daysElapsedInFiscalYear(): number {
  const fyStart = dayjs(new Date(fiscalYearStartYear(), 3, 1));
  return dayjs().diff(fyStart, "day") + 1;
}

function RevenueBarChart({
  data,
}: {
  data: Array<{ month: string; revenue: number }>;
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const showAmounts = data.length <= 6;

  return (
    <div className={`flex items-end h-20 w-full ${showAmounts ? "gap-3" : "gap-1"}`}>
      {data.map((d) => {
        const heightPct = Math.round((d.revenue / max) * 100);
        const label = dayjs(d.month + "-01").format("MMM");
        const isLast = d === data[data.length - 1];
        return (
          <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
            {showAmounts && (
              <span className="text-xs text-muted-foreground">
                ₹{formatIndian(d.revenue)}
              </span>
            )}
            <div className="w-full flex items-end" style={{ height: "48px" }}>
              <div
                className={`w-full rounded-sm transition-all ${isLast ? "bg-primary" : "bg-primary/30"}`}
                style={{ height: `${heightPct}%`, minHeight: d.revenue > 0 ? "4px" : "0" }}
                title={`₹${formatIndian(d.revenue)}`}
              />
            </div>
            <span className="text-xs font-medium">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BuyerAnalyticsSummaryCards({ data }: { data: BuyerAnalyticsData }) {
  return (
    <>
      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Purchased — {fiscalYearLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{data.fiscalYearRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.thisFiscalYearInvoiceCount} invoice
            {data.thisFiscalYearInvoiceCount === 1 ? "" : "s"} this FY ·{" "}
            {data.lifetimeInvoiceCount} lifetime
          </p>
          {data.yoyChangePct !== null ? (
            <p
              className={`text-xs mt-2 flex items-center gap-1 ${
                data.yoyChangePct >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.yoyChangePct >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(Math.round(data.yoyChangePct))}%{" "}
              {data.yoyChangePct >= 0 ? "up" : "down"} vs same point in{" "}
              {previousFiscalYearLabel()} (₹
              {formatIndian(data.lastFiscalYearToDateRevenue)})
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              {daysElapsedInFiscalYear() < 7
                ? "Too early in the fiscal year to compare"
                : `No comparable purchases in ${previousFiscalYearLabel()}`}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Purchase Cadence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.avgCadenceDays !== null ? (
            <>
              <div className="text-2xl font-bold">
                ~{Math.round(data.avgCadenceDays)} days
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average time between invoices ({data.lifetimeInvoiceCount} total)
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Not enough invoices yet to estimate
            </p>
          )}
          {data.daysSinceLastInvoice !== null && (
            <p className="text-xs text-muted-foreground mt-2">
              Last purchase {data.daysSinceLastInvoice === 0 ? "today" : `${data.daysSinceLastInvoice} day${data.daysSinceLastInvoice === 1 ? "" : "s"} ago`}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function BuyerAnalyticsDetailCards({ data }: { data: BuyerAnalyticsData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Purchases — {fiscalYearLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueBarChart data={data.revenueChart} />
        </CardContent>
      </Card>

      {data.topProducts.length > 0 && (
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Products — {fiscalYearLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {data.topProducts.map((product, i) => {
                const max = data.topProducts[0].revenue;
                const widthPct = Math.round((product.revenue / max) * 100);
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-sm">
                      <span
                        className="truncate font-medium max-w-[55%]"
                        title={product.name}
                      >
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
