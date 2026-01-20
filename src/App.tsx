// App.tsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import NavigationAppBar from "./components/AppBar";
import LoginPage from "./pages/Login.page";
import CreateInvoicePage from "./pages/CreateInvoice.page";
import InvoicesPage from "./pages/Invoices.page";
import InvoiceViewPage from "./pages/InvoiceView.page";
import BuyerPage from "./pages/Buyer.page";
import ProductsPage from "./pages/Products.page";
import DashboardPage from "./pages/Dashboard.page";

function App() {
  return (
    <div className="min-h-screen flex md:flex-col">
      <NavigationAppBar />
      <div className="w-full flex-1 mb-20 md:mb-0 flex">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CreateInvoicePage />
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
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
