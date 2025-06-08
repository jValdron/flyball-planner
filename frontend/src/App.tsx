import { Container, Navbar, Nav } from 'react-bootstrap'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Dogs from './pages/Dogs'
import Practices from './pages/Practices'
import DogView from './pages/DogView'
import { ClubProvider, useClub } from './contexts/ClubContext'
import { ClubPicker } from './components/ClubPicker'

function Header() {
  const { selectedClubId, setSelectedClubId } = useClub()

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">Flyball Practice Planner</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/dogs">Dogs</Nav.Link>
            <Nav.Link as={Link} to="/practices">Practices</Nav.Link>
          </Nav>
          <div className="d-flex align-items-center">
            <ClubPicker
              selectedClubId={selectedClubId}
              onClubChange={setSelectedClubId}
            />
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

function App() {
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
            <Route path="/practices" element={<Practices />} />
          </Routes>
        </Container>
      </ClubProvider>
    </Router>
  )
}

export default App
