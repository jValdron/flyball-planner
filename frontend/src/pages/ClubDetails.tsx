import { Container, Form, Button, Alert, Spinner, Table, Breadcrumb } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useClub } from '../contexts/ClubContext'
import { Save, PlusLg, Trash, CheckLg, XLg } from 'react-bootstrap-icons'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { SaveSpinner } from '../components/SaveSpinner'
import { useMutation } from '@apollo/client'
import { UpdateClub, DeleteLocation } from '../graphql/clubs'
import type { Location, Club } from '../graphql/generated/graphql'

function ClubDetails() {
  const navigate = useNavigate()
  const { selectedClub, setSelectedClub, locations, error: contextError } = useClub()
  const [club, setClub] = useState<Partial<Club>>({})
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState<{ id: string; name: string } | null>(null)

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
          defaultPracticeTime: club.defaultPracticeTime
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

  const sortedLocations = [...locations]
    .sort((a: Location, b: Location) => a.name.localeCompare(b.name))

  const displayError = error || contextError

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/')}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>{selectedClub?.name}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{selectedClub?.name}</h1>
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

        <div className="d-flex gap-2 mt-4 justify-content-end">
          <Button type="submit" variant="success" disabled={updating}>
            <Save className="me-2" />
            Save Changes
          </Button>
        </div>
      </Form>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Locations</h2>
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
              <td colSpan={5} className="text-center text-muted py-4">
                No locations found
              </td>
            </tr>
          ) : (
            sortedLocations.map((location: Location) => (
              <tr
                key={location.id}
                onClick={() => navigate(`/locations/${location.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td>{location.name}</td>
                <td className="text-center">{location.isDefault ? <CheckLg /> : <XLg />}</td>
                <td className="text-center">{location.isDoubleLane ? <CheckLg /> : <XLg />}</td>
                <td className="text-nowrap">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => navigate(`/locations/${location.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLocationToDelete({ id: location.id, name: location.name })
                      setShowDeleteModal(true)
                    }}
                  >
                    <Trash />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

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
      <SaveSpinner show={updating} />
    </Container>
  )
}

export default ClubDetails
