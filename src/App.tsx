// App.tsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import NavigationAppBar from "./components/AppBar";
import InvoicePage from "./pages/Invoice.page";
import InvoicesPage from "./pages/Invoices.page";
import InvoiceViewPage from "./pages/InvoiceView.page";
import BuyerPage from "./pages/Buyer.page";
import BuyerCreatePage from "./pages/BuyerCreate.page";
import BuyerDetailsPage from "./pages/BuyerDetails.page";
import BuyerEditPage from "./pages/BuyerEdit.page";
import ProductsPage from "./pages/Products.page";
import ProductCreatePage from "./pages/ProductCreate.page";
import ProductDetailsPage from "./pages/ProductDetails.page";
import ProductEditPage from "./pages/ProductEdit.page";

function App() {
  return (
    <div>
      <NavigationAppBar />
      <Routes>
        <Route path="/" element={<InvoicePage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoice/:id" element={<InvoiceViewPage />} />
        <Route path="/buyer" element={<BuyerPage />} />
        <Route path="/buyer/create" element={<BuyerCreatePage />} />
        <Route path="/buyer/:id" element={<BuyerDetailsPage />} />
        <Route path="/buyer/edit/:id" element={<BuyerEditPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/create" element={<ProductCreatePage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/products/edit/:id" element={<ProductEditPage />} />
      </Routes>
    </div>
  );
}

export default App;
