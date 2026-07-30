import { Outlet } from "react-router-dom";
import Footer from "../ui/Footer";
import Navbar from "../ui/Navbar";

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <main style={{ marginTop: "var(--navbar-height)", minHeight: "100vh", padding: "var(--space-6) var(--space-4)" }}>
        <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto", width: "100%" }}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  );
}
