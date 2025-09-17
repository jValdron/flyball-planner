import { Container, Button, Alert, Spinner, Breadcrumb, Card, Badge } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Trash, Pencil } from 'react-bootstrap-icons'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import DogNotes from '../components/DogNotes'
import DogModal from '../components/DogModal'
import { useQuery, useMutation } from '@apollo/client'
import { GetDogById, DeleteDog } from '../graphql/dogs'
import { formatFullDateTime } from '../utils/dateUtils'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import TrainingLevelBadge from '../components/TrainingLevelBadge'
import { useClub } from '../contexts/ClubContext'

function DogDetails() {
  const navigate = useNavigate()
  const { dogId } = useParams()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { handlers } = useClub()

  const { data: dogData, loading: loadingDog, refetch } = useQuery(GetDogById, {
    variables: { id: dogId || '' },
    skip: !dogId,
    onError: (error) => {
      setError('Failed to load dog details. Please try again later.')
      console.error('Error loading dog:', error)
    }
  })

  const title = dogId ? `${dogData?.dog?.name} - Dog Details` : 'Dog Details'
  useDocumentTitle(title)

  const [deleteDog, { loading: deleting }] = useMutation(DeleteDog, {
    onCompleted: () => navigate('/dogs'),
    onError: (error) => {
      setError('Failed to delete dog. Please try again later.')
      console.error('Error deleting dog:', error)
    }
  })

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

  const handleEditSuccess = () => {
    refetch()
  }

  const owner = handlers.find(handler => handler.id === dogData?.dog?.ownerId)

  const loading = loadingDog
  const saving = deleting

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (!dogData?.dog) {
    return (
      <Container>
        <Alert variant="danger" className="mt-4">
          Dog not found.
        </Alert>
      </Container>
    )
  }

  const dog = dogData.dog

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/')}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/dogs')}>Handlers & Dogs</Breadcrumb.Item>
        <Breadcrumb.Item active>{dog.name}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">{dog.name}</h1>
          {dog.crn && (
            <p className="text-muted mb-0">
              <span className="font-monospace">{dog.crn}</span>
            </p>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            className="d-flex align-items-center"
            onClick={() => setShowEditModal(true)}
            disabled={saving}
          >
            <Pencil className="me-2" />
            Edit Dog
          </Button>
          <Button
            variant="outline-danger"
            className="d-flex align-items-center"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
          >
            <Trash className="me-2" />
            Delete Dog
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <div className="row mb-4">
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Dog Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="row mb-2">
                <div className="col-4"><strong>Status:</strong></div>
                <div className="col-8">
                  <Badge bg={dog.status === 'Active' ? 'success' : 'secondary'}>
                    {dog.status}
                  </Badge>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-4"><strong>Training Level:</strong></div>
                <div className="col-8">
                  <TrainingLevelBadge level={dog.trainingLevel} />
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-4"><strong>Owner:</strong></div>
                <div className="col-8">
                  {owner ? `${owner.givenName} ${owner.surname}` : 'Unknown'}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Timestamps</h5>
            </Card.Header>
            <Card.Body>
              <div className="row mb-2">
                <div className="col-4"><strong>Created:</strong></div>
                <div className="col-8 text-muted">
                  {formatFullDateTime(dog.createdAt)}
                </div>
              </div>
              <div className="row">
                <div className="col-4"><strong>Last Updated:</strong></div>
                <div className="col-8 text-muted">
                  {formatFullDateTime(dog.updatedAt)}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <DogNotes dogId={dog.id} dogName={dog.name} />

      <DeleteConfirmationModal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Dog"
        message={`Are you sure you want to delete ${dog.name}? This action cannot be undone.`}
      />

      <DogModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        dog={dog}
        onSuccess={handleEditSuccess}
      />
    </Container>
  )
}

export default DogDetails
