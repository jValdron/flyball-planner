import { useState } from 'react'

import { Container, Form, Button, Alert, Spinner, Breadcrumb } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Save, Trash } from 'react-bootstrap-icons'
import { useQuery, useMutation } from '@apollo/client'

import type { Location } from '../graphql/generated/graphql'
import { GetLocationById, CreateLocation, UpdateLocation, DeleteLocation } from '../graphql/clubs'
import { formatFullDateTime } from '../utils/dateUtils'
import { useClub } from '../contexts/ClubContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'

function LocationDetails() {
  const navigate = useNavigate()
  const { locationId } = useParams()
  const { selectedClub } = useClub()
  const [formData, setFormData] = useState<Pick<Location, 'name' | 'isDefault' | 'isDoubleLane'>>({
    name: '',
    isDefault: false,
    isDoubleLane: true
  })
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: locationData, loading: loadingLocation } = useQuery(GetLocationById, {
    variables: { id: locationId || '' },
    skip: !locationId,
    onCompleted: (data) => {
      if (data.location) {
        setFormData({
          name: data.location.name,
          isDefault: data.location.isDefault,
          isDoubleLane: data.location.isDoubleLane
        })
      }
    },
    onError: (error) => {
      setError('Failed to load location details. Please try again later.')
      console.error('Error loading location:', error)
    }
  })

  const title = locationId ? `${locationData?.location?.name} - Location Details` : 'New Location'
  useDocumentTitle(title)

  const [createLocation, { loading: creating }] = useMutation(CreateLocation, {
    onCompleted: () => navigate('/club'),
    onError: (error) => {
      setError('Failed to create location. Please try again later.')
      console.error('Error creating location:', error)
    }
  })

  const [updateLocation, { loading: updating }] = useMutation(UpdateLocation, {
    onCompleted: () => navigate('/club'),
    onError: (error) => {
      setError('Failed to update location. Please try again later.')
      console.error('Error updating location:', error)
    }
  })

  const [deleteLocation, { loading: deleting }] = useMutation(DeleteLocation, {
    onCompleted: () => navigate('/club'),
    onError: (error) => {
      setError('Failed to delete location. Please try again later.')
      console.error('Error deleting location:', error)
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      if (locationId) {
        await updateLocation({
          variables: {
            id: locationId,
            ...formData
          }
        })
      } else {
        await createLocation({
          variables: {
            ...formData,
            clubId: selectedClub?.id || ''
          }
        })
      }
    } catch (err) {
      // Error is handled in the mutation
    }
  }

  const handleDelete = async () => {
    try {
      setError(null)
      if (!locationId) return
      await deleteLocation({
        variables: { id: locationId }
      })
    } catch (err) {
      // Error is handled in the mutation
    } finally {
      setShowDeleteModal(false)
    }
  }

  const loading = loadingLocation
  const saving = creating || updating || deleting

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/')}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/club')}>{selectedClub?.name}</Breadcrumb.Item>
        <Breadcrumb.Item active>
          {locationId ? locationData?.location?.name : 'Add New Location'}
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">{locationId ? locationData?.location?.name : 'Add New Location'}</h2>
        {locationId && (
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            disabled={saving}
          >
            <Trash className="me-2" />
            Delete Location
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="isDefaultSwitch"
            name="isDefault"
            label="Default Location"
            checked={formData.isDefault}
            onChange={handleInputChange}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="isDoubleLaneSwitch"
            name="isDoubleLane"
            label="Has Two Lanes?"
            checked={formData.isDoubleLane}
            onChange={handleInputChange}
          />
        </Form.Group>


        <div className="d-flex gap-2 mt-4 justify-content-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/club')}
            disabled={saving}
          >
            <ChevronLeft className="me-2" />
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={saving}>
            <Save className="me-2" />
            {locationId ? 'Save Changes' : 'Create Location'}
          </Button>
        </div>
      </Form>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Location"
        message={`Are you sure you want to delete ${locationData?.location?.name}? This action cannot be undone.`}
      />

      {locationData?.location && (
        <div className="mt-4 text-muted">
          <p><strong>Created:</strong> {formatFullDateTime(locationData.location.createdAt)}</p>
          <p><strong>Last Updated:</strong> {formatFullDateTime(locationData.location.updatedAt)}</p>
        </div>
      )}
    </Container>
  )
}

export default LocationDetails
