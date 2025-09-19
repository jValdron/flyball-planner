import React, { useState } from 'react'
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { PersonPlus, CheckLg, XLg } from 'react-bootstrap-icons'
import { useQuery, useMutation } from '@apollo/client'

import { USER_INVITE_BY_CODE, ACCEPT_USER_INVITE } from '../graphql/userManagement'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export const InviteRegistration: React.FC = () => {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useDocumentTitle('Join Club - Invite Registration')

  const { data: inviteData, loading: inviteLoading, error: inviteError } = useQuery(USER_INVITE_BY_CODE, {
    variables: { code: code || '' },
    skip: !code
  })

  const [acceptUserInvite, { loading: accepting }] = useMutation(ACCEPT_USER_INVITE, {
    onCompleted: () => {
      setSuccess('Account created successfully! You can now log in.')
      setError(null)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    },
    onError: (error) => {
      setError(error.message || 'Failed to create account. Please try again.')
      setSuccess(null)
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (!code) {
      setError('Invalid invite code')
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await acceptUserInvite({
        variables: {
          code,
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        }
      })
    } catch (err) {
      // Error is handled in onError callback
    }
  }

  if (inviteLoading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Body className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading invite...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  if (inviteError || !inviteData?.userInviteByCode) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Header className="text-center">
                <h4 className="mb-0">Invalid Invite</h4>
              </Card.Header>
              <Card.Body className="text-center py-5">
                <XLg size={48} className="text-danger mb-3" />
                <p>This invite link is invalid or has expired.</p>
                <Button variant="primary" onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  const invite = inviteData.userInviteByCode

  if (invite.isExpired) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Header className="text-center">
                <h4 className="mb-0">Invite Expired</h4>
              </Card.Header>
              <Card.Body className="text-center py-5">
                <XLg size={48} className="text-danger mb-3" />
                <p>This invite has expired. Please contact the club administrator for a new invite.</p>
                <Button variant="primary" onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  if (invite.isUsed) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Header className="text-center">
                <h4 className="mb-0">Invite Already Used</h4>
              </Card.Header>
              <Card.Body className="text-center py-5">
                <CheckLg size={48} className="text-success mb-3" />
                <p>This invite has already been used. You can log in with your account.</p>
                <Button variant="primary" onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header className="text-center">
              <PersonPlus className="me-2" />
              <h4 className="mb-0">Join {invite.club.name}</h4>
            </Card.Header>
            <Card.Body>
              <p className="text-muted text-center mb-4">
                You've been invited to join <strong>{invite.club.name}</strong> by{' '}
                {invite.invitedBy ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}` : 'a club member'}.
                Create your account below to get started.
              </p>

              {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                  {success}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    isInvalid={formData.password.length > 0 && formData.password.length < 6}
                  />
                  {formData.password.length > 0 && formData.password.length < 6 && (
                    <Form.Control.Feedback type="invalid">
                      Password must be at least 6 characters long
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    isInvalid={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword}
                    isValid={formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword && formData.password.length >= 6}
                  />
                  {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                    <Form.Control.Feedback type="invalid">
                      Passwords do not match
                    </Form.Control.Feedback>
                  )}
                  {formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
                    <Form.Control.Feedback type="valid">
                      Passwords match
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button type="submit" variant="primary" disabled={accepting}>
                    <PersonPlus className="me-2" />
                    {accepting ? 'Creating Account...' : 'Create Account & Join Club'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
