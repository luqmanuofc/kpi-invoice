// App.tsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import NavigationAppBar from "./components/AppBar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login.page";
import InvoicePage from "./pages/Invoice.page";
import InvoicesPage from "./pages/Invoices.page";
import InvoiceViewPage from "./pages/InvoiceView.page";
import BuyerPage from "./pages/Buyer.page";
import ProductsPage from "./pages/Products.page";

function App() {
  return (
    <div>
      <NavigationAppBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <InvoicePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoice/:id"
          element={
            <ProtectedRoute>
              <InvoiceViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/*"
          element={
            <ProtectedRoute>
              <BuyerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/*"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
