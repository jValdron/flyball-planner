import { Container, Navbar, Nav } from 'react-bootstrap'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useParams, useNavigate } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { client } from './apollo/client'
import { Suspense, lazy } from 'react'
import { ClubProvider } from './contexts/ClubContext'
import { PracticeProvider } from './contexts/PracticeContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ClubLoadingWrapper } from './components/ClubLoadingWrapper'
import { WebSocketStatus } from './components/WebSocketStatus'
import { UserDropdown } from './components/UserDropdown'
import { LoginForm } from './components/LoginForm'
import logo from './assets/logo-full-dark.svg'

// Lazy load page components
const HandlerDetails = lazy(() => import('./pages/HandlerDetails'))
const Dogs = lazy(() => import('./pages/Dogs'))
const DogDetails = lazy(() => import('./pages/DogDetails'))
const Practices = lazy(() => import('./pages/Practices'))
const PracticeDetails = lazy(() => import('./pages/PracticeDetails'))
const ClubDetails = lazy(() => import('./pages/ClubDetails'))
const AccountDetails = lazy(() => import('./pages/AccountDetails').then(module => ({ default: module.AccountDetails })))
const LocationDetails = lazy(() => import('./pages/LocationDetails'))
const PublicPracticeView = lazy(() => import('./pages/PublicPracticeView'))

function Header() {
  const { user } = useAuth();

  return (
    <Navbar bg="black" variant="dark" expand="md" className="mb-4 custom-navbar">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img src={logo} alt="Flyball Planner" height="40" />
        </Navbar.Brand>
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

function PublicHeaderContent() {
  const { user } = useAuth();
  const { practiceId } = useParams();
  const navigate = useNavigate();

  const handleBackToPractice = () => {
    navigate(`/practices/${practiceId}/sets`);
  };

  return (
    <Navbar bg="black" variant="dark" expand="md" className="mb-4 custom-navbar">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img src={logo} alt="Flyball Planner" height="40" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={handleBackToPractice} className="cur-point">
              ← Back to Practice
            </Nav.Link>
          </Nav>
          <div className="d-flex align-items-center gap-2">
            {user && <UserDropdown />}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

function PublicHeader() {
  return <PublicHeaderContent />;
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
      <Route path="/practices/:practiceId/view" element={
        isAuthenticated ? (
          <ClubProvider>
            <PracticeProvider>
              <PublicHeader />
              <Container>
                <PublicPracticeView />
              </Container>
              <WebSocketStatus />
            </PracticeProvider>
          </ClubProvider>
        ) : (
          <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
            <PublicPracticeView />
          </Suspense>
        )
      } />
      <Route path="/*" element={
        isAuthenticated ? (
          <ClubProvider>
            <PracticeProvider>
              <Header />
              <ClubLoadingWrapper>
                <Container>
                  <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<Practices />} />
                      <Route path="/account" element={<AccountDetails />} />
                      <Route path="/dogs" element={<Dogs />} />
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
                      <Route path="/practices/:practiceId/recap" element={<PracticeDetails />} />
                    </Routes>
                  </Suspense>
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
