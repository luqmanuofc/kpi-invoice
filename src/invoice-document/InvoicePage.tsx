// InvoicePage.tsx
import type { InvoiceForm } from "../invoice-form/InvoiceFormPage";
import {
  TaxLabel,
  HeaderSection,
  InvoiceMeta,
  ReceiverSection,
  ItemsTableHeader,
  ItemsTableRow,
  TotalsTable,
  AmountWordsSection,
  FooterSection,
} from "./InvoiceTemplateComponents";

type Props = {
  data: InvoiceForm;
  items: InvoiceForm["items"];
  showTotals: boolean;
  showWords: boolean;
  showFooter: boolean;
  rowStartIndex: number;
  isFirstPage: boolean;
  pageNumber: number;
  totalPages: number;
};

export default function InvoicePage({
  data,
  items,
  showTotals,
  showWords,
  showFooter,
  rowStartIndex,
  isFirstPage,
  pageNumber,
  totalPages,
}: Props) {
  return (
    <div className="invoice-page">
      <div className="invoice-border">
        <TaxLabel />

        <HeaderSection data={data} />

        <hr className="divider" />

        <InvoiceMeta data={data} />

        <hr className="divider" />

        {isFirstPage && <ReceiverSection data={data} />}

        {(items.length > 0 || isFirstPage) && (
          <table className="items-table">
            <ItemsTableHeader />

            <tbody>
              {items.map((item, idx) => {
                const serial = rowStartIndex + idx + 1;
                return <ItemsTableRow key={idx} item={item} serial={serial} />;
              })}
            </tbody>
          </table>
        )}

        {showTotals && (
          <>
            <TotalsTable data={data} />
            <div className="clear-float"></div>
          </>
        )}

        {showWords && <AmountWordsSection data={data} />}

        {showFooter && <FooterSection data={data} />}

        <div className="page-number-label">
          Page {pageNumber} of {totalPages}
        </div>
      </div>
    </div>
  );
}
