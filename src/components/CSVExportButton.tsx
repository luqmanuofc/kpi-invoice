import { Button, CircularProgress } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useState } from "react";
import { getInvoicesForExport, type InvoiceExportData } from "../api/dashboard";
import dayjs from "dayjs";
import * as XLSX from "xlsx-js-style";

interface CSVExportButtonProps {
  month: string;
}

export default function CSVExportButton({ month }: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const convertToExcel = (data: InvoiceExportData[]): Blob => {
    // Headers
    const headers = [
      "Invoice Number",
      "Date of Invoice",
      "Buyer Name",
      "Subtotal",
      "CGST",
      "SGST",
      "IGST",
      "Total",
    ];

    const allRows: any[][] = [];

    // Separate invoices into B2C (no GST) and B2B (with GST)
    const b2cInvoices = data.filter(inv => !inv.buyerGstin || inv.buyerGstin.trim() === "");
    const b2bInvoices = data.filter(inv => inv.buyerGstin && inv.buyerGstin.trim() !== "");

    // Group each category by buyer
    const groupByBuyer = (invoices: InvoiceExportData[]) => {
      return invoices.reduce((acc, invoice) => {
        if (!acc[invoice.buyerId]) {
          acc[invoice.buyerId] = {
            buyerName: invoice.buyerName,
            buyerGstin: invoice.buyerGstin,
            invoices: [],
          };
        }
        acc[invoice.buyerId].invoices.push(invoice);
        return acc;
      }, {} as Record<string, { buyerName: string; buyerGstin: string; invoices: InvoiceExportData[] }>);
    };

    const b2cGrouped = groupByBuyer(b2cInvoices);
    const b2bGrouped = groupByBuyer(b2bInvoices);

    // Add headers first
    allRows.push(headers);

    // Add empty row after headers
    allRows.push([]);

    // Track category header and buyer header row indices for styling
    const categoryHeaderRows: number[] = [];
    const buyerHeaderRows: number[] = [];
    const totalRows: number[] = [];

    // Helper function to add buyer groups
    const addBuyerGroups = (groupedByBuyer: typeof b2cGrouped) => {
      Object.values(groupedByBuyer).forEach((buyer) => {
        // Add buyer header row: Buyer Name, GST Number
        buyerHeaderRows.push(allRows.length);
        allRows.push([buyer.buyerName, buyer.buyerGstin]);

        // Add invoice rows for this buyer
        buyer.invoices.forEach((invoice) => {
          allRows.push([
            invoice.invoiceNumber,
            dayjs(invoice.date).format("DD/MM/YYYY"),
            invoice.buyerName,
            Number(invoice.subtotal.toFixed(2)),
            Number(invoice.cgstAmount.toFixed(2)),
            Number(invoice.sgstAmount.toFixed(2)),
            Number(invoice.igstAmount.toFixed(2)),
            Number(invoice.total.toFixed(2)),
          ]);
        });

        // Add empty row after each buyer's invoices
        allRows.push([""]);
      });
    };

    // Helper function to calculate totals for a category
    const calculateTotals = (invoices: InvoiceExportData[]) => {
      return invoices.reduce(
        (acc, inv) => ({
          subtotal: acc.subtotal + inv.subtotal,
          cgst: acc.cgst + inv.cgstAmount,
          sgst: acc.sgst + inv.sgstAmount,
          igst: acc.igst + inv.igstAmount,
          total: acc.total + inv.total,
        }),
        { subtotal: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
      );
    };

    // Add B2C section
    if (Object.keys(b2cGrouped).length > 0) {
      categoryHeaderRows.push(allRows.length);
      allRows.push(["B2C"]);
      allRows.push([""]);
      addBuyerGroups(b2cGrouped);

      // Add B2C total row
      const b2cTotals = calculateTotals(b2cInvoices);
      totalRows.push(allRows.length);
      allRows.push([
        "",
        "",
        "Total B2C Section:",
        Number(b2cTotals.subtotal.toFixed(2)),
        Number(b2cTotals.cgst.toFixed(2)),
        Number(b2cTotals.sgst.toFixed(2)),
        Number(b2cTotals.igst.toFixed(2)),
        Number(b2cTotals.total.toFixed(2)),
      ]);
      allRows.push([""]);
    }

    // Add B2B section
    if (Object.keys(b2bGrouped).length > 0) {
      categoryHeaderRows.push(allRows.length);
      allRows.push(["B2B"]);
      allRows.push([""]);
      addBuyerGroups(b2bGrouped);

      // Add B2B total row
      const b2bTotals = calculateTotals(b2bInvoices);
      totalRows.push(allRows.length);
      allRows.push([
        "",
        "",
        "Total B2B Section:",
        Number(b2bTotals.subtotal.toFixed(2)),
        Number(b2bTotals.cgst.toFixed(2)),
        Number(b2bTotals.sgst.toFixed(2)),
        Number(b2bTotals.igst.toFixed(2)),
        Number(b2bTotals.total.toFixed(2)),
      ]);
      allRows.push([""]);
    }

    // Add grand total row (B2C + B2B)
    if (data.length > 0) {
      const grandTotals = calculateTotals(data);
      totalRows.push(allRows.length);
      allRows.push([
        "",
        "",
        "Total B2C + B2B Section:",
        Number(grandTotals.subtotal.toFixed(2)),
        Number(grandTotals.cgst.toFixed(2)),
        Number(grandTotals.sgst.toFixed(2)),
        Number(grandTotals.igst.toFixed(2)),
        Number(grandTotals.total.toFixed(2)),
      ]);
    }

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Apply styling to category header rows (B2C/B2B)
    categoryHeaderRows.forEach((rowIdx) => {
      const categoryCell = `A${rowIdx + 1}`;
      if (!ws[categoryCell]) ws[categoryCell] = { t: "s", v: "" };
      ws[categoryCell].s = {
        font: {
          bold: true,
          sz: 24
        },
        fill: {
          patternType: "solid",
          fgColor: { rgb: "D1E7DD" }  // Light green background
        },
        alignment: {
          vertical: "center",
          horizontal: "left"
        }
      };
    });

    // Apply styling to buyer header rows
    buyerHeaderRows.forEach((rowIdx) => {
      // Style buyer name (column A) - Bold with background
      const buyerNameCell = `A${rowIdx + 1}`;
      if (!ws[buyerNameCell]) ws[buyerNameCell] = { t: "s", v: "" };
      ws[buyerNameCell].s = {
        font: {
          bold: true,
          sz: 12
        },
        fill: {
          patternType: "solid",
          fgColor: { rgb: "E8F4F8" }
        },
        alignment: {
          vertical: "center",
          horizontal: "left"
        }
      };

      // Style GST (column B) - Blue text with background
      const gstCell = `B${rowIdx + 1}`;
      if (!ws[gstCell]) ws[gstCell] = { t: "s", v: "" };
      ws[gstCell].s = {
        font: {
          color: { rgb: "1E3A8A" },
          sz: 11
        },
        fill: {
          patternType: "solid",
          fgColor: { rgb: "E8F4F8" }
        },
        alignment: {
          vertical: "center",
          horizontal: "left"
        }
      };
    });

    // Apply styling to total rows
    totalRows.forEach((rowIdx) => {
      const columns = ["C", "D", "E", "F", "G", "H"];
      columns.forEach((col) => {
        const cell = `${col}${rowIdx + 1}`;
        if (!ws[cell]) ws[cell] = { t: "n", v: 0 };
        ws[cell].s = {
          font: {
            bold: true,
            sz: 12
          },
          fill: {
            patternType: "solid",
            fgColor: { rgb: "FFF3CD" }  // Light yellow background
          },
          alignment: {
            vertical: "center",
            horizontal: col === "C" ? "left" : "right"
          }
        };
      });
    });

    // Set column widths
    ws["!cols"] = [
      { wch: 15 }, // Invoice Number
      { wch: 15 }, // Date
      { wch: 25 }, // Buyer Name
      { wch: 12 }, // Subtotal
      { wch: 10 }, // CGST
      { wch: 10 }, // SGST
      { wch: 10 }, // IGST
      { wch: 12 }, // Total
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  const downloadExcel = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    if (!month) {
      alert("Please select a month first");
      return;
    }

    try {
      setIsExporting(true);

      // Fetch invoice data for the selected month
      const invoices = await getInvoicesForExport(month);

      if (invoices.length === 0) {
        alert("No invoices found for the selected month");
        return;
      }

      // Convert to Excel
      const excelBlob = convertToExcel(invoices);

      // Generate filename with month
      const filename = `invoices_${month}.xlsx`;

      // Trigger download
      downloadExcel(excelBlob, filename);
    } catch (error: any) {
      console.error("Export failed:", error);
      alert(`Failed to export Excel: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="contained"
      startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
      onClick={handleExport}
      disabled={isExporting}
      sx={{ textTransform: "none" }}
    >
      {isExporting ? "Exporting..." : "Export Excel"}
    </Button>
  );
}
