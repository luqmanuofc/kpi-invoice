import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState, useEffect } from "react";
import dayjs, { type Dayjs } from "dayjs";
import MonthlyRevenueChart from "../components/MonthlyRevenueChart";
import CSVExportButton from "../components/CSVExportButton";
import { getDashboardMetrics } from "../api/dashboard";

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
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInvoices: 0,
    totalRevenue: 0,
    monthlyData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div style={{ margin: "2rem" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h6">Dashboard</Typography>
          <CSVExportButton month={selectedMonth?.format("YYYY-MM") || ""} />
        </Box>

        {error && (
          <Box mb={3}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        <Box mb={3} display="flex" gap={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Select Month:
          </Typography>
          <DatePicker
            label="Month"
            value={selectedMonth}
            onChange={(newValue) => setSelectedMonth(newValue)}
            views={["month", "year"]}
            slotProps={{
              textField: { size: "small", sx: { width: 200 } },
            }}
          />
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total # of Invoices
                </Typography>
                <Typography variant="h4">
                  {metrics.totalInvoices.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  For {selectedMonth?.format("MMMM YYYY")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  ₹{metrics.totalRevenue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  For {selectedMonth?.format("MMMM YYYY")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Revenue Chart
            </Typography>
            <MonthlyRevenueChart data={metrics.monthlyData} />
          </CardContent>
        </Card>
      </div>
    </LocalizationProvider>
  );
}
