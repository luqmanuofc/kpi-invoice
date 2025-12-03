import { useForm, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

type InvoiceForm = {
  buyerName: string;
  address: string;
  invoiceNumber: string;
  date: string;
  description: string;
  qty: number;
  rate: number;
};

export default function InvoiceFormPage() {
  const { control, handleSubmit } = useForm<InvoiceForm>({
    defaultValues: {
      buyerName: "",
      address: "",
      invoiceNumber: "",
      date: dayjs().format("YYYY-MM-DD"),
      description: "",
      qty: 1,
      rate: 0,
    },
  });

  const onSubmit = (data: InvoiceForm) => {
    console.log(data);
    // hook up generateInvoicePdf(data) later
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ width: 420, mt: 4, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create Invoice
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
          <Controller
            name="buyerName"
            control={control}
            render={({ field }) => (
              <TextField label="Buyer Name" fullWidth {...field} />
            )}
          />

          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={3}
                {...field}
              />
            )}
          />

          <Controller
            name="invoiceNumber"
            control={control}
            render={({ field }) => (
              <TextField label="Invoice Number" fullWidth {...field} />
            )}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <MobileDatePicker
                label="Date"
                value={dayjs(field.value)}
                onChange={(newValue) => {
                  field.onChange(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "");
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField label="Item Description" fullWidth {...field} />
            )}
          />

          <Controller
            name="qty"
            control={control}
            render={({ field }) => (
              <TextField type="number" label="Quantity" fullWidth {...field} />
            )}
          />

          <Controller
            name="rate"
            control={control}
            render={({ field }) => (
              <TextField type="number" label="Rate" fullWidth {...field} />
            )}
          />

          <Button type="submit" variant="contained" size="large">
            Generate PDF
          </Button>
        </Stack>
      </form>
    </Paper>
    </LocalizationProvider>
  );
}
