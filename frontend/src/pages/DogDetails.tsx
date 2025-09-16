import { Container, Form, Button, Alert, Spinner, Breadcrumb } from 'react-bootstrap'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useClub } from '../contexts/ClubContext'
import { ChevronLeft, Save, Trash } from 'react-bootstrap-icons'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import DogNotes from '../components/DogNotes'
import { useQuery, useMutation } from '@apollo/client'
import { GetDogById, GetDogsByHandlersInClub, CreateDog, UpdateDog, DeleteDog } from '../graphql/dogs'
import { DogStatus, TrainingLevel } from '../graphql/generated/graphql'
import type { Dog } from '../graphql/generated/graphql'
import { formatFullDateTime } from '../utils/dateUtils'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

function DogDetails() {
  const navigate = useNavigate()
  const { dogId } = useParams()
  const [searchParams] = useSearchParams()
  const { selectedClub } = useClub()
  const [formData, setFormData] = useState<Partial<Dog>>({
    name: '',
    trainingLevel: TrainingLevel.Beginner,
    clubId: selectedClub?.id || '',
    ownerId: searchParams.get('ownerId') || '',
    status: DogStatus.Active
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: dogData, loading: loadingDog } = useQuery(GetDogById, {
    variables: { id: dogId || '' },
    skip: !dogId,
    onCompleted: (data) => {
      if (data.dog) {
        setFormData({
          name: data.dog.name,
          crn: data.dog.crn,
          trainingLevel: data.dog.trainingLevel,
          ownerId: data.dog.ownerId,
          status: data.dog.status
        })
      }
    },
    onError: (error) => {
      setError('Failed to load dog details. Please try again later.')
      console.error('Error loading dog:', error)
    }
  })

  const title = dogId ? `${dogData?.dog?.name} - Dog Details` : 'New Dog'
  useDocumentTitle(title)

  const { data: ownersData, loading: loadingOwners } = useQuery(GetDogsByHandlersInClub, {
    variables: { clubId: selectedClub?.id || '' },
    skip: !selectedClub?.id,
    onError: (error) => {
      console.error('Error loading owners:', error)
    }
  })

  const [createDog, { loading: creating }] = useMutation(CreateDog, {
    onCompleted: () => navigate('/dogs'),
    onError: (error) => {
      setError('Failed to create dog. Please try again later.')
      console.error('Error creating dog:', error)
    }
  })

  const [updateDog, { loading: updating }] = useMutation(UpdateDog, {
    onCompleted: () => navigate('/dogs'),
    onError: (error) => {
      setError('Failed to update dog. Please try again later.')
      console.error('Error updating dog:', error)
    }
  })

  const [deleteDog, { loading: deleting }] = useMutation(DeleteDog, {
    onCompleted: () => navigate('/dogs'),
    onError: (error) => {
      setError('Failed to delete dog. Please try again later.')
      console.error('Error deleting dog:', error)
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'trainingLevel' ? value as TrainingLevel : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      if (dogId) {
        await updateDog({
          variables: {
            id: dogId,
            ...formData
          }
        })
      } else {
        await createDog({
          variables: {
            ...formData,
            clubId: selectedClub?.id || ''
          } as any
        })
      }
    } catch (err) {
    }
  }

  const handleDelete = async () => {
    try {
      setError(null)
      if (!dogId) return
      await deleteDog({
        variables: { id: dogId }
      })
    } catch (err) {
    } finally {
      setShowDeleteConfirm(false)
    }
  }

  const loading = loadingDog || loadingOwners
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
        <Breadcrumb.Item onClick={() => navigate('/dogs')}>Handlers & Dogs</Breadcrumb.Item>
        <Breadcrumb.Item active>
          {dogId ? dogData?.dog?.name : 'Add New Dog'}
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{dogId ? 'Edit Dog' : 'Add New Dog'}</h1>
        {dogId && (
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
          >
            <Trash className="me-2" />
            Delete Dog
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
          <Form.Label>Status</Form.Label>
          <Form.Select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
          >
            <option value={DogStatus.Active}>Active</option>
            <option value={DogStatus.Inactive}>Inactive</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>CRN</Form.Label>
          <Form.Control
            type="text"
            name="crn"
            value={formData.crn || ''}
            onChange={handleInputChange}
            className="font-monospace"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Training Level</Form.Label>
          <Form.Select
            name="trainingLevel"
            value={formData.trainingLevel}
            onChange={handleInputChange}
            required
          >
            <option value={TrainingLevel.Beginner}>Beginner</option>
            <option value={TrainingLevel.Novice}>Novice</option>
            <option value={TrainingLevel.Intermediate}>Intermediate</option>
            <option value={TrainingLevel.Advanced}>Advanced</option>
            <option value={TrainingLevel.Solid}>Solid</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Owner</Form.Label>
          <Form.Select
            name="ownerId"
            value={formData.ownerId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select an owner</option>
            {ownersData?.dogsByHandlersInClub?.map(handler => (
              <option key={handler.id} value={handler.id}>
                {`${handler.givenName} ${handler.surname}`}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <div className="d-flex gap-2 mt-4 justify-content-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/dogs')}
            disabled={saving}
          >
            <ChevronLeft className="me-2" />
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={saving}>
            <Save className="me-2" />
            {dogId ? 'Save Changes' : 'Create Dog'}
          </Button>
        </div>
      </Form>

      <DeleteConfirmationModal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Dog"
        message={`Are you sure you want to delete ${dogData?.dog?.name}? This action cannot be undone.`}
      />

      {dogId && dogData?.dog && (
        <div className="mt-5">
          <DogNotes dogId={dogId} dogName={dogData.dog.name} />
        </div>
      )}

      {dogData?.dog && (
        <div className="mt-4 text-muted">
          <p><strong>Created:</strong> {formatFullDateTime(dogData.dog.createdAt)}</p>
          <p><strong>Last Updated:</strong> {formatFullDateTime(dogData.dog.updatedAt)}</p>
        </div>
      )}
    </Container>
  )
}

export default DogDetails
