// App.tsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import NavigationAppBar from "./components/AppBar";
import InvoicePage from "./pages/Invoice.page";
import BuyerPage from "./pages/Buyer.page";

function App() {
  return (
    <div>
      <NavigationAppBar />
      <Routes>
        <Route path="/" element={<InvoicePage />} />
        <Route path="/buyer" element={<BuyerPage />} />
      </Routes>
    </div>
  );
}

export default App;
