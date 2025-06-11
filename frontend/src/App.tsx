import { Container, Navbar, Nav } from 'react-bootstrap'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Dogs from './pages/Dogs'
import Practices from './pages/Practices'
import PracticeView from './pages/PracticeView'
import DogView from './pages/DogView'
import OwnerView from './pages/OwnerView'
import { ClubProvider } from './contexts/ClubContext'
import { ClubPicker } from './components/ClubPicker'
import { websocketService } from './services/websocketService'

function Header() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">Flyball Practice Planner</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/practices">Practices</Nav.Link>
            <Nav.Link as={Link} to="/dogs">Dogs</Nav.Link>
          </Nav>
          <div className="d-flex align-items-center">
            <ClubPicker />
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

function App() {
  useEffect(() => {
    // Initialize WebSocket connection
    websocketService.connect();

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <Router>
      <ClubProvider>
        <Header />
        <Container>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dogs" element={<Dogs />} />
            <Route path="/dogs/new" element={<DogView />} />
            <Route path="/dogs/:dogId" element={<DogView />} />
            <Route path="/owners/:ownerId" element={<OwnerView />} />
            <Route path="/practices" element={<Practices />} />
            <Route path="/practices/new" element={<PracticeView />} />
            <Route path="/practices/:practiceId" element={<PracticeView />} />
            <Route path="/practices/:practiceId/attendance" element={<PracticeView />} />
            <Route path="/practices/:practiceId/sets" element={<PracticeView />} />
          </Routes>
        </Container>
      </ClubProvider>
    </Router>
  )
}

export default App
