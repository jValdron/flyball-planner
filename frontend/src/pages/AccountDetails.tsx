import React, { useState, useEffect } from 'react'

import { Container, Form, Button, Alert, Breadcrumb, Card, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { Save, Key, Person } from 'react-bootstrap-icons'
import { useMutation } from '@apollo/client'

import { UpdateUser, ChangePassword } from '../graphql/auth'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export const AccountDetails: React.FC = () => {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  useDocumentTitle('Account Details')

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      })
    }
  }, [user])

  const [updateUser, { loading: updatingProfile }] = useMutation(UpdateUser, {
    onCompleted: (data) => {
      setUser(data.updateUser)
      setProfileSuccess('Profile updated successfully!')
      setProfileError(null)
      setTimeout(() => setProfileSuccess(null), 3000)
    },
    onError: (error) => {
      setProfileError(error.message || 'Failed to update profile. Please try again.')
      setProfileSuccess(null)
    }
  })

  const [changePassword, { loading: changingPassword }] = useMutation(ChangePassword, {
    onCompleted: () => {
      setPasswordSuccess('Password changed successfully!')
      setPasswordError(null)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => setPasswordSuccess(null), 3000)
    },
    onError: (error) => {
      setPasswordError(error.message || 'Failed to change password. Please try again.')
      setPasswordSuccess(null)
    }
  })

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setProfileError(null)
      setProfileSuccess(null)
      await updateUser({
        variables: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          email: profileForm.email
        }
      })
    } catch (err) {
      // Error is handled in onError callback
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
      return
    }

    try {
      setPasswordError(null)
      setPasswordSuccess(null)
      await changePassword({
        variables: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }
      })
    } catch (err) {
      // Error is handled in onError callback
    }
  }

  if (!user) {
    return null
  }

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/')}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Account Details</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Account Details</h1>
      </div>

      <Row>
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <Person className="me-2" />
              Profile Information
            </Card.Header>
            <Card.Body>
              {profileError && (
                <Alert variant="danger" onClose={() => setProfileError(null)} dismissible>
                  {profileError}
                </Alert>
              )}
              {profileSuccess && (
                <Alert variant="success" onClose={() => setProfileSuccess(null)} dismissible>
                  {profileSuccess}
                </Alert>
              )}

              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    required
                  />
                </Form.Group>

                <div className="d-flex gap-2 justify-content-end">
                  <Button type="submit" variant="success" disabled={updatingProfile}>
                    <Save className="me-2" />
                    {updatingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <Key className="me-2" />
              Change Password
            </Card.Header>
            <Card.Body>
              {passwordError && (
                <Alert variant="danger" onClose={() => setPasswordError(null)} dismissible>
                  {passwordError}
                </Alert>
              )}
              {passwordSuccess && (
                <Alert variant="success" onClose={() => setPasswordSuccess(null)} dismissible>
                  {passwordSuccess}
                </Alert>
              )}

              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    required
                    minLength={6}
                    isInvalid={passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 6}
                  />
                  {passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 6 && (
                    <Form.Control.Feedback type="invalid">
                      Password must be at least 6 characters long
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    required
                    isInvalid={passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword}
                    isValid={passwordForm.confirmPassword.length > 0 && passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword.length >= 6}
                  />
                  {passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <Form.Control.Feedback type="invalid">
                      Passwords do not match
                    </Form.Control.Feedback>
                  )}
                  {passwordForm.confirmPassword.length > 0 && passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword.length >= 6 && (
                    <Form.Control.Feedback type="valid">
                      Passwords match
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <div className="d-flex gap-2 justify-content-end">
                  <Button type="submit" variant="primary" disabled={changingPassword}>
                    <Key className="me-2" />
                    {changingPassword ? 'Changing...' : 'Change Password'}
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
