import { Typography, Box, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";

interface BuyerRow {
  id: string;
  name: string;
  address: string;
  gstin: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 200 },
  { field: "name", headerName: "Name", width: 200 },
  { field: "address", headerName: "Address", width: 300 },
  { field: "gstin", headerName: "GSTIN", width: 150 },
  { field: "phone", headerName: "Phone", width: 150 },
];

const rows: BuyerRow[] = [
  // TODO: Replace with actual data from API
];

export default function BuyerPage() {
  const navigate = useNavigate();

  const handleCreateClick = () => {
    navigate("/buyer/create");
  };

  return (
    <div style={{ margin: "2rem" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignContent={"center"}
        p={1}
      >
        <Typography variant="h6" sx={{ mb: 3 }}>
          Buyers
        </Typography>
        <div>
          {" "}
          <Button variant="outlined" size="small" onClick={handleCreateClick}>
            Create
          </Button>
        </div>
      </Box>
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
        />
      </Box>
    </div>
  );
}
