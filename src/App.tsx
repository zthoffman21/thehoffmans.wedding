import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import RSVP from './pages/RSVP'
import Gallery from './pages/Gallary'
import Info from './pages/Info'
import Invite from './pages/Invite'

export default function App() {
  const location = useLocation()
  const isInvite = location.pathname.startsWith('/invite')

  return (
    <div className="min-h-screen flex flex-col">
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
        </Routes>
      </main>

      {!isInvite && <Footer />}
    </div>
  )
}
