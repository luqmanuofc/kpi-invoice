import { Box, Typography } from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";

interface MonthlyData {
  month: string;
  revenue: number;
  sales: number;
}

interface MonthlyRevenueChartProps {
  data: MonthlyData[];
}

export default function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  // TODO: Install and implement a charting library like recharts
  // For now, showing a placeholder

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
        border: "2px dashed",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.default",
        p: 4,
      }}
    >
      <BarChartIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Chart Placeholder
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Monthly revenue chart will be displayed here
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
        Data points: {data.length}
      </Typography>
    </Box>
  );
}
