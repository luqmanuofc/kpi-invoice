import {
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
  IconButton,
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { Controller, useFieldArray } from "react-hook-form";
import { useInvoice } from "../contexts/InvoiceProvider";

export default function InvoiceFormItemsPage() {
  const { form } = useInvoice();
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  return (
    <>
      <Stack spacing={3}>
        {fields.map((item, index) => (
          <Paper key={item.id} sx={{ p: 2 }} elevation={1}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1">Item {index + 1}</Typography>
                <IconButton color="error" onClick={() => remove(index)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>

              <Controller
                name={`items.${index}.description`}
                control={control}
                render={({ field }) => (
                  <TextField label="Description" fullWidth {...field} />
                )}
              />

              <Controller
                name={`items.${index}.hsn`}
                control={control}
                render={({ field }) => (
                  <TextField label="HSN Code" fullWidth {...field} />
                )}
              />

              <Stack direction="row" spacing={1}>
                <Controller
                  name={`items.${index}.qty`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="number"
                      label="Qty"
                      fullWidth
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.unit`}
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      freeSolo
                      options={["Kg", "Pcs", "Bundle", "Dozen", "Bag"]}
                      value={value || ""}
                      onChange={(_, newValue) => onChange(newValue)}
                      onInputChange={(_, newInputValue) =>
                        onChange(newInputValue)
                      }
                      fullWidth
                      renderInput={(params) => (
                        <TextField {...params} label="Unit" />
                      )}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.rate`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="number"
                      label="Rate"
                      sx={{ width: "100%" }}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />
              </Stack>
            </Stack>
          </Paper>
        ))}

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() =>
            append({
              description: "",
              hsn: "",
              qty: 1,
              unit: "Kg",
              rate: 0,
            })
          }
        >
          Add Item
        </Button>
      </Stack>
    </>
  );
}
