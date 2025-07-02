import { Container, Navbar, Nav } from 'react-bootstrap'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { client } from './apollo/client'
import HandlerDetails from './pages/HandlerDetails'
import Dogs from './pages/Dogs'
import DogDetails from './pages/DogDetails'
import Practices from './pages/Practices'
import PracticeDetails from './pages/PracticeDetails'
import ClubDetails from './pages/ClubDetails'
import { AccountDetails } from './pages/AccountDetails'
import { ClubProvider } from './contexts/ClubContext'
import { PracticeProvider } from './contexts/PracticeContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ClubLoadingWrapper } from './components/ClubLoadingWrapper'
import { WebSocketStatus } from './components/WebSocketStatus'
import { UserDropdown } from './components/UserDropdown'

import { LoginForm } from './components/LoginForm'
import LocationDetails from './pages/LocationDetails'

function Header() {
  const { user } = useAuth();

  return (
    <Navbar bg="black" variant="dark" expand="md" className="mb-4 custom-navbar">
      <Container>
        <Navbar.Brand as={Link} to="/">Flyball Planner</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/practices">Practices</Nav.Link>
            <Nav.Link as={Link} to="/dogs">Dogs</Nav.Link>
            <Nav.Link as={Link} to="/club">Club</Nav.Link>
          </Nav>
          <div className="d-flex align-items-center gap-2">
            {user && <UserDropdown />}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = window.location.pathname;

  if (isLoading && location !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <AppWithTitle isAuthenticated={isAuthenticated} />
    </Router>
  )
}

function AppWithTitle({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/practices" replace /> : <LoginForm />
      } />
      <Route path="/*" element={
        isAuthenticated ? (
          <ClubProvider>
            <PracticeProvider>
              <Header />
              <ClubLoadingWrapper>
                <Container>
                  <Routes>
                    <Route path="/" element={<Practices />} />
                    <Route path="/account" element={<AccountDetails />} />
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
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  )
}

function App() {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ApolloProvider>
  )
}

export default App
