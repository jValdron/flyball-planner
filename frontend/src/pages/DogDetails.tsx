import { useState } from 'react'

import { Container, Button, Alert, Spinner, Breadcrumb, Card, Badge, ListGroup } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash, Pencil } from 'react-bootstrap-icons'
import { useQuery, useMutation } from '@apollo/client'

import type { DogNote } from '../graphql/generated/graphql'
import { GetDogById, DeleteDog } from '../graphql/dogs'
import { GET_DOG_NOTES, CREATE_DOG_NOTE, UPDATE_DOG_NOTE, DELETE_DOG_NOTE } from '../graphql/dogNotes'
import { formatFullDateTime } from '../utils/dateUtils'
import { enrichDogs } from '../utils/dogsUtils'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useClub } from '../contexts/ClubContext'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import DogNotes from '../components/DogNotes'
import DogModal from '../components/DogModal'
import TrainingLevelBadge from '../components/TrainingLevelBadge'

function DogDetails() {
  const navigate = useNavigate()
  const { dogId } = useParams()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { handlers, dogs } = useClub()

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

  const { data: notesData, loading: notesLoading, error: notesError, refetch: refetchNotes } = useQuery(GET_DOG_NOTES, {
    variables: { dogId: dogId || '' },
    skip: !dogId,
    onError: (error) => {
      console.error('Error loading notes:', error)
    }
  })

  const notes = enrichDogs(notesData?.dogNotes || [], dogs) as DogNote[]

  const [createNote] = useMutation(CREATE_DOG_NOTE, {
    onError: (error) => {
      console.error('Error creating note:', error)
    }
  })

  const [updateNote] = useMutation(UPDATE_DOG_NOTE, {
    onError: (error) => {
      console.error('Error updating note:', error)
    }
  })

  const [deleteNote] = useMutation(DELETE_DOG_NOTE, {
    onError: (error) => {
      console.error('Error deleting note:', error)
    }
  })

  const handleCreateNote = async (content: string, clubId: string) => {
    try {
      await createNote({
        variables: {
          input: {
            content: content.trim(),
            dogId: dogId || '',
            clubId
          }
        }
      })
    } catch (err) {
      // Error handled in onError
    }
  }

  const handleUpdateNote = async (id: string, content: string) => {
    try {
      await updateNote({
        variables: {
          id,
          content: content.trim()
        }
      })
    } catch (err) {
      // Error handled in onError
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote({
        variables: { id }
      })
    } catch (err) {
      // Error handled in onError
    }
  }

  const [deleteDog] = useMutation(DeleteDog, {
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
  const saving = false

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
          <h2 className="mb-0">
            {dog.name}
            {dog.crn && (
              <span className="fs-6 text-muted font-monospace ps-2">CRN {dog.crn}</span>
            )}
          </h2>
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
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <strong>Status</strong>
                <Badge bg={dog.status === 'Active' ? 'success' : 'secondary'}>
                  {dog.status}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <strong>Training Level</strong>
                <TrainingLevelBadge level={dog.trainingLevel} />
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <strong>Owner</strong>
                <span>{owner ? `${owner.givenName} ${owner.surname}` : 'Unknown'}</span>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </div>
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Timestamps</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <strong>Created</strong>
                <span className="text-muted">{formatFullDateTime(dog.createdAt)}</span>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <strong>Last Updated</strong>
                <span className="text-muted">{formatFullDateTime(dog.updatedAt)}</span>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </div>
      </div>

      <DogNotes
        notes={notes}
        dog={dog}
        onCreateNote={(content, clubId) => handleCreateNote(content, clubId)}
        onEditNote={(note) => handleUpdateNote(note.id, note.content)}
        onDeleteNote={handleDeleteNote}
        onNoteChanged={() => refetchNotes()}
        loading={notesLoading}
        error={notesError?.message || null}
      />

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
