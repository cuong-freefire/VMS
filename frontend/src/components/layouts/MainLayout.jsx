import { Outlet } from "react-router-dom";
import Footer from "../ui/Footer";
import Navbar from "../ui/Navbar";

export default function MainLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ flex: 1, marginTop: "var(--navbar-height)" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
