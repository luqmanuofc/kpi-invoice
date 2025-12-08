// App.tsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import NavigationAppBar from "./components/AppBar";
import InvoicePage from "./pages/Invoice.page";
import InvoicesPage from "./pages/Invoices.page";
import BuyerPage from "./pages/Buyer.page";
import BuyerCreatePage from "./pages/BuyerCreate.page";
import BuyerEditPage from "./pages/BuyerEdit.page";

function App() {
  return (
    <div>
      <NavigationAppBar />
      <Routes>
        <Route path="/" element={<InvoicePage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/buyer" element={<BuyerPage />} />
        <Route path="/buyer/create" element={<BuyerCreatePage />} />
        <Route path="/buyer/:id" element={<BuyerEditPage />} />
      </Routes>
    </div>
  );
}

export default App;
