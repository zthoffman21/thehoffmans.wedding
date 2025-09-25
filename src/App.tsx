import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import RSVP from "./pages/RSVP";
import Gallery from "./pages/Gallery";
import Info from "./pages/Info";
import Invite from "./pages/Invite";
import Guide from "./pages/Guide";
import AdminDashboard from "./pages/admin";
import ScrollToTop from "./Scroll";

export default function App() {
    const location = useLocation();
    const isInvite = location.pathname.startsWith("/invite");

    return (
        <div className="min-h-screen flex flex-col">
            <ScrollToTop />

            {!isInvite && <Navbar />}

            <main className="flex-1">
                <Routes>
                    {/* Invite (no nav/footer) */}
                    <Route path="/invite" element={<Invite />} />
                    <Route path="/invite/:code" element={<Invite />} />

                    {/* Public site */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/rsvp" element={<RSVP />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/info" element={<Info />} />
                    <Route path="/guide" element={<Guide />} />

                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </main>
        </div>
    );
}
