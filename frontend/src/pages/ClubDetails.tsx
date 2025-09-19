import { useState, useEffect } from 'react'

import { Container, Form, Button, Alert, Table, Breadcrumb, Tabs, Tab } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { Save, PlusLg, Trash, CheckLg, XLg, Pencil, PersonPlus, People, Envelope, Copy } from 'react-bootstrap-icons'
import { useMutation, useQuery } from '@apollo/client'

import type { Location, Club, User, UserInvite } from '../graphql/generated/graphql'
import { UpdateClub, DeleteLocation } from '../graphql/clubs'
import { USERS_BY_CLUB, USER_INVITES_BY_CLUB, REMOVE_USER_FROM_CLUB } from '../graphql/userManagement'
import { useClub } from '../contexts/ClubContext'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { SaveSpinner } from '../components/SaveSpinner'
import { UserInviteModal } from '../components/UserInviteModal'

function ClubDetails() {
  const navigate = useNavigate()
  const { selectedClub, setSelectedClub, locations, error: contextError } = useClub()
  const { user } = useAuth()
  const [club, setClub] = useState<Partial<Club>>({})
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState<{ id: string; name: string } | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [userToRemove, setUserToRemove] = useState<{ id: string; username: string } | null>(null)
  const [showRemoveUserModal, setShowRemoveUserModal] = useState(false)

  const title = selectedClub?.name ? `${selectedClub.name} - Club Details` : 'Club Details'
  useDocumentTitle(title)

  useEffect(() => {
    if (selectedClub) {
      setClub(selectedClub)
    }
  }, [selectedClub])

  const [updateClub, { loading: updating }] = useMutation(UpdateClub, {
    onCompleted: (data) => {
      setSelectedClub(data.updateClub as Club)
    },
    onError: (error) => {
      setError('Failed to update club. Please try again later.')
      console.error('Error updating club:', error)
    }
  })

  const [deleteLocation] = useMutation(DeleteLocation, {
    onError: (error) => {
      setError('Failed to delete location. Please try again later.')
      console.error('Error deleting location:', error)
    }
  })

  const [removeUserFromClub] = useMutation(REMOVE_USER_FROM_CLUB, {
    onCompleted: () => {
      setShowRemoveUserModal(false)
      setUserToRemove(null)
    },
    onError: (error) => {
      setError('Failed to remove user from club. Please try again later.')
      console.error('Error removing user:', error)
    }
  })

  // Queries for user management
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(USERS_BY_CLUB, {
    variables: { clubId: selectedClub?.id || '' },
    skip: !selectedClub?.id
  })

  const { data: invitesData, loading: invitesLoading, refetch: refetchInvites } = useQuery(USER_INVITES_BY_CLUB, {
    variables: { clubId: selectedClub?.id || '' },
    skip: !selectedClub?.id
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setClub(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      await updateClub({
        variables: {
          id: selectedClub?.id || '',
          name: club.name,
          nafaClubNumber: club.nafaClubNumber,
          defaultPracticeTime: club.defaultPracticeTime,
          idealSetsPerDog: typeof club.idealSetsPerDog === 'number' ? club.idealSetsPerDog : Number(club.idealSetsPerDog)
        }
      })
    } catch (err) {
    }
  }

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return
    try {
      setError(null)
      await deleteLocation({
        variables: { id: locationToDelete.id }
      })
    } catch (err) {
    } finally {
      setShowDeleteModal(false)
      setLocationToDelete(null)
    }
  }

  const handleRemoveUser = async () => {
    if (!userToRemove || !selectedClub) return
    try {
      setError(null)
      await removeUserFromClub({
        variables: { userId: userToRemove.id, clubId: selectedClub.id }
      })
      refetchUsers()
    } catch (err) {
    }
  }

  const handleInviteCreated = () => {
    refetchInvites()
  }

  const sortedLocations = [...locations]
    .sort((a: Location, b: Location) => a.name.localeCompare(b.name))

  const users = usersData?.usersByClub || []
  const invites = invitesData?.userInvitesByClub || []

  const displayError = error || contextError

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/')}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>{selectedClub?.name}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">{selectedClub?.name}</h2>
      </div>

      {displayError && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {displayError}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} className="mb-5">
        <Form.Group className="mb-3">
          <Form.Label>Club Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={club.name || ''}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>NAFA Club Number</Form.Label>
          <Form.Control
            type="number"
            name="nafaClubNumber"
            value={club.nafaClubNumber || ''}
            onChange={handleInputChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Default Practice Time (HH:mm)</Form.Label>
          <Form.Control
            type="time"
            name="defaultPracticeTime"
            value={club.defaultPracticeTime || ''}
            onChange={handleInputChange}
            placeholder="10:00"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Ideal Sets Per Dog</Form.Label>
          <Form.Control
            type="number"
            min={1}
            step={1}
            name="idealSetsPerDog"
            value={club.idealSetsPerDog ?? 2}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <div className="d-flex gap-2 mt-4 justify-content-end">
          <Button type="submit" variant="success" disabled={updating}>
            <Save className="me-2" />
            Save Changes
          </Button>
        </div>
      </Form>

      <div className="mb-5">
        <Tabs defaultActiveKey="locations">
          <Tab eventKey="locations" title={
            <>
              <PlusLg className="me-1" />
              Locations
            </>
          }>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0">Locations</h3>
              <Button variant="primary" onClick={() => navigate('/locations/new')}>
                <PlusLg className="me-2" />
                New Location
              </Button>
            </div>

            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th className="w-100">Name</th>
                  <th className="text-center">Default</th>
                  <th className="text-center text-nowrap">Two Lanes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedLocations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      No locations found
                    </td>
                  </tr>
                ) : (
                  sortedLocations.map((location: Location) => (
                    <tr
                      key={location.id}
                      onClick={() => navigate(`/locations/${location.id}`)}
                      className="cur-point"
                    >
                      <td>{location.name}</td>
                      <td className="text-center">{location.isDefault ? <CheckLg /> : <XLg />}</td>
                      <td className="text-center">{location.isDoubleLane ? <CheckLg /> : <XLg />}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/locations/${location.id}`)}
                            className="text-nowrap d-flex align-items-center"
                          >
                            <Pencil className="me-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="d-flex align-items-center"
                            onClick={(e) => {
                              e.stopPropagation()
                              setLocationToDelete({ id: location.id, name: location.name })
                              setShowDeleteModal(true)
                            }}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Tab>

          <Tab eventKey="users" title={
            <>
              <People className="me-1" />
              Users
            </>
          }>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0">Users</h3>
              <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                <PersonPlus className="me-2" />
                Invite User
              </Button>
            </div>

            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((clubUser: User) => (
                    <tr key={clubUser.id}>
                      <td>{clubUser.username}</td>
                      <td>{clubUser.firstName} {clubUser.lastName}</td>
                      <td>{clubUser.email}</td>
                      <td>{new Date(clubUser.createdAt).toLocaleDateString()}</td>
                      <td>
                        {clubUser.id !== user?.id && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setUserToRemove({ id: clubUser.id, username: clubUser.username })
                              setShowRemoveUserModal(true)
                            }}
                          >
                            <Trash />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Tab>

          <Tab eventKey="invites" title={
            <>
              <Envelope className="me-1" />
              Invites
            </>
          }>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0">Pending Invites</h3>
              <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                <PersonPlus className="me-2" />
                New Invite
              </Button>
            </div>

            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Invited By</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invitesLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : invites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No invites found
                    </td>
                  </tr>
                ) : (
                  invites.map((invite: UserInvite) => (
                    <tr key={invite.id}>
                      <td>{invite.email}</td>
                      <td>{invite.invitedBy ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}` : 'Unknown'}</td>
                      <td>{new Date(invite.createdAt).toLocaleDateString()}</td>
                      <td>{new Date(invite.expiresAt).toLocaleDateString()}</td>
                      <td>
                        {invite.isUsed ? (
                          <span className="badge bg-success">Used</span>
                        ) : invite.isExpired ? (
                          <span className="badge bg-danger">Expired</span>
                        ) : (
                          <span className="badge bg-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        {!invite.isUsed && !invite.isExpired && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              // Copy invite link to clipboard
                              const link = `${window.location.origin}/invite/${invite.code}`
                              navigator.clipboard.writeText(link)
                            }}
                          >
                            <Copy className="me-1" />
                            Copy Link
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Tab>
        </Tabs>
      </div>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false)
          setLocationToDelete(null)
        }}
        onConfirm={handleDeleteLocation}
        title="Delete Location"
        message={`Are you sure you want to delete ${locationToDelete?.name}? This action cannot be undone.`}
      />

      <DeleteConfirmationModal
        show={showRemoveUserModal}
        onHide={() => {
          setShowRemoveUserModal(false)
          setUserToRemove(null)
        }}
        onConfirm={handleRemoveUser}
        title="Remove User from Club"
        message={`Are you sure you want to remove ${userToRemove?.username} from this club?`}
      />

      <UserInviteModal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        clubId={selectedClub?.id || ''}
        onInviteCreated={handleInviteCreated}
      />

      <SaveSpinner show={updating} />
    </Container>
  )
}

export default ClubDetails
