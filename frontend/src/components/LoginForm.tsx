import { useState } from 'react'

import { Form, Button, Alert, Container, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import logoLight from '../assets/logo-full-light.svg'
import logoDark from '../assets/logo-full-dark.svg'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useDocumentTitle('Login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting || isLoading) {
      return;
    }

    if (!username.trim() || !password.trim()) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/practices');
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting;

  const canSubmit = username.trim() && password.trim();

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <img
              src={isDark ? logoDark : logoLight}
              alt="Flyball Planner"
              height="60"
              className="mb-3"
            />
          </div>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="username">Username</Form.Label>
              <Form.Control
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="password">Password</Form.Label>
              <Form.Control
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-100"
              disabled={isFormDisabled || !canSubmit}
            >
              {isFormDisabled ? 'Signing in...' : 'Sign in'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
