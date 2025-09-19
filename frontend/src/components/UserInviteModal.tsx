import React, { useState } from 'react'
import { Modal, Button, Form, Alert, InputGroup } from 'react-bootstrap'
import { Envelope, Copy, CheckLg } from 'react-bootstrap-icons'
import { useMutation } from '@apollo/client'

import { CREATE_USER_INVITE } from '../graphql/userManagement'
import type { UserInvite } from '../graphql/generated/graphql'

interface UserInviteModalProps {
  show: boolean
  onHide: () => void
  clubId: string
  onInviteCreated?: (invite: UserInvite) => void
}

export const UserInviteModal: React.FC<UserInviteModalProps> = ({
  show,
  onHide,
  clubId,
  onInviteCreated
}) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [createUserInvite, { loading }] = useMutation(CREATE_USER_INVITE, {
    onCompleted: (data) => {
      const invite = data.createUserInvite
      setSuccess('Invite created successfully!')
      setError(null)

      const link = `${window.location.origin}/invite/${invite.code}`
      setInviteLink(link)

      if (onInviteCreated) {
        onInviteCreated(invite)
      }
    },
    onError: (error) => {
      setError(error.message || 'Failed to create invite. Please try again.')
      setSuccess(null)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    try {
      setError(null)
      setSuccess(null)
      setInviteLink(null)
      setCopied(false)

      await createUserInvite({
        variables: {
          email: email.trim(),
          clubId
        }
      })
    } catch (err) {
      // Error is handled in onError callback
    }
  }

  const handleCopyLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy link:', err)
      }
    }
  }

  const handleClose = () => {
    setEmail('')
    setError(null)
    setSuccess(null)
    setInviteLink(null)
    setCopied(false)
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <Envelope className="me-2" />
          Invite User to Club
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              disabled={loading}
            />
            <Form.Text className="text-muted">
              If the user already has an account, they'll be added to the club immediately.
              If not, they'll receive an invite link to create an account.
            </Form.Text>
          </Form.Group>

          <div className="d-flex gap-2 justify-content-end">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invite'}
            </Button>
          </div>
        </Form>

        {inviteLink && (
          <div className="mt-4 p-3 border-top">
            <h6>Invite Link</h6>
            <p className="text-muted mb-2">
              Share this link with the user to join the club:
            </p>
            <InputGroup>
              <Form.Control
                type="text"
                value={inviteLink}
                readOnly
                className="font-monospace"
              />
              <Button
                variant="outline-secondary"
                onClick={handleCopyLink}
                disabled={copied}
              >
                {copied ? (
                  <>
                    <CheckLg className="me-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="me-1" />
                    Copy
                  </>
                )}
              </Button>
            </InputGroup>
          </div>
        )}
      </Modal.Body>
    </Modal>
  )
}
