import { Container, Navbar, Nav } from 'react-bootstrap'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { client } from './apollo/client'
import HandlerDetails from './pages/HandlerDetails'
import Dogs from './pages/Dogs'
import DogDetails from './pages/DogDetails'
import Practices from './pages/Practices'
import PracticeDetails from './pages/PracticeDetails'
import ClubDetails from './pages/ClubDetails'
import { ClubProvider } from './contexts/ClubContext'
import { PracticeProvider } from './contexts/PracticeContext'
import { ClubPicker } from './components/ClubPicker'
import { ClubLoadingWrapper } from './components/ClubLoadingWrapper'
import { WebSocketStatus } from './components/WebSocketStatus'
import LocationDetails from './pages/LocationDetails'

function Header() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">Flyball Practice Planner</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/practices">Practices</Nav.Link>
            <Nav.Link as={Link} to="/dogs">Dogs</Nav.Link>
            <Nav.Link as={Link} to="/club">Club</Nav.Link>
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
  return (
    <ApolloProvider client={client}>
      <Router>
        <ClubProvider>
          <PracticeProvider>
            <Header />
            <ClubLoadingWrapper>
              <Container>
                <Routes>
                  <Route path="/" element={<Practices />} />
                  <Route path="/dogs" element={<Dogs />} />
                  <Route path="/dogs/new" element={<DogDetails />} />
                  <Route path="/dogs/:dogId" element={<DogDetails />} />
                  <Route path="/handlers/:handlerId" element={<HandlerDetails />} />
                  <Route path="/club" element={<ClubDetails />} />
                  <Route path="/locations/new" element={<LocationDetails />} />
                  <Route path="/locations/:locationId" element={<LocationDetails />} />
                  <Route path="/practices" element={<Practices />} />
                  <Route path="/practices/new" element={<PracticeDetails />} />
                  <Route path="/practices/:practiceId" element={<PracticeDetails />} />
                  <Route path="/practices/:practiceId/attendance" element={<PracticeDetails />} />
                  <Route path="/practices/:practiceId/sets" element={<PracticeDetails />} />
                  <Route path="/practices/:practiceId/checks" element={<PracticeDetails />} />
                </Routes>
              </Container>
            </ClubLoadingWrapper>
            <WebSocketStatus />
          </PracticeProvider>
        </ClubProvider>
      </Router>
    </ApolloProvider>
  )
}

export default App
