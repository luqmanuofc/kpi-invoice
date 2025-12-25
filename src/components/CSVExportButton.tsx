import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

interface MonthlyData {
  month: string;
  revenue: number;
  sales: number;
}

interface CSVExportButtonProps {
  data: MonthlyData[];
  month: string;
}

export default function CSVExportButton({ data, month }: CSVExportButtonProps) {
  const handleExport = () => {
    // TODO: Implement CSV export functionality
    console.log("Exporting data for month:", month);
    console.log("Data:", data);

    // Placeholder alert
    alert("CSV export functionality will be implemented here");
  };

  return (
    <Button
      variant="contained"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      sx={{ textTransform: "none" }}
    >
      Export CSV
    </Button>
  );
}
