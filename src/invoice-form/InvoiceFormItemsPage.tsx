import {
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

import { Controller, useFieldArray } from "react-hook-form";
import { useInvoice } from "../contexts/InvoiceProvider";
import AddProductsModal from "./AddProductsModal";
import type { Product } from "../api/products";
import { useState, useEffect } from "react";

export default function InvoiceFormItemsPage() {
  const { form } = useInvoice();
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (fields.length === 0) {
      setModalOpen(true);
    }
  }, [fields.length]);

  const handleAddProducts = (products: Product[]) => {
    // Batch append all products at once to trigger only one re-render
    const newItems = products.map((product) => ({
      productId: product.id,
      description: product.name,
      hsn: product.hsn,
      qty: 1,
      unit: product.defaultUnit,
      rate: product.defaultPrice,
      lineTotal: product.defaultPrice,
    }));

    append(newItems);
  };
  return (
    <>
      <Stack spacing={3}>
        {fields.map((item, index) => (
          <Paper
            key={item.id}
            sx={{ p: 2, position: "relative", bgcolor: 'grey.50' }}
            elevation={1}
          >
            <IconButton
              color="error"
              onClick={() => remove(index)}
              sx={{
                position: "absolute",
                top: -12,
                right: -12,
                backgroundColor: "white",
                border: "1px solid",
                borderColor: "divider",
                "&:hover": {
                  backgroundColor: "error.light",
                  borderColor: "error.main",
                  color: "white",
                },
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <Stack spacing={2}>
              <Typography align="left">
                {index + 1}. {form.getValues("items")[index].description}
              </Typography>

              <Stack direction="column" spacing={1}>
                <div
                  style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                >
                  <Controller
                    name={`items.${index}.qty`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        type="number"
                        label="Quantity"
                        size="small"
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
                    render={({ field }) => (
                      <TextField label="Unit" size="small" {...field} />
                    )}
                  />
                </div>

                <Controller
                  name={`items.${index}.rate`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="number"
                      label="Rate"
                      size="small"
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
              </Stack>
            </Stack>
          </Paper>
        ))}

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          Add Items
        </Button>
      </Stack>

      <AddProductsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddProducts={handleAddProducts}
      />
    </>
  );
}
