import { Outlet } from "react-router-dom";
import Footer from "../ui/Footer";
import Navbar from "../ui/Navbar";

export default function MainLayout() {
    return (
        <div className="d-flex flex-column">
            <Navbar />

            <main className="flex-grow-1" style={{ minHeight: 'calc(100vh - 90px)' }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}
