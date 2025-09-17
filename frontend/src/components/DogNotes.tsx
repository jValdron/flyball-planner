import { useState } from 'react'
import { Button, Form, Alert, Modal } from 'react-bootstrap'
import { PlusLg, Pencil, Trash, Calendar3, CheckLg, ChevronRight } from 'react-bootstrap-icons'
import { useQuery, useMutation } from '@apollo/client'
import { GET_DOG_NOTES, CREATE_DOG_NOTE, UPDATE_DOG_NOTE, DELETE_DOG_NOTE, type DogNote } from '../graphql/dogNotes'
import { SetType, Lane, TrainingLevel } from '../graphql/generated/graphql'
import { formatFullDateTime } from '../utils/dateUtils'
import { Link } from 'react-router-dom'
import { useClub } from '../contexts/ClubContext'
import { SetViewOnly } from './PracticeSet/SetViewOnly'
import DeleteConfirmationModal from './DeleteConfirmationModal'

interface DogNotesProps {
  dogId: string
  dogName: string
}

function DogNotes({ dogId, dogName }: DogNotesProps) {
  const { selectedClub } = useClub()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingNote, setEditingNote] = useState<DogNote | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  const { data, loading, refetch } = useQuery(GET_DOG_NOTES, {
    variables: { dogId },
    onError: (error) => {
      setError('Failed to load notes. Please try again later.')
      console.error('Error loading notes:', error)
    }
  })

  const [createNote] = useMutation(CREATE_DOG_NOTE, {
    onCompleted: () => {
      setShowCreateModal(false)
      setNoteContent('')
      setEditingNote(null)
      setError(null)
      refetch()
    },
    onError: (error) => {
      setError('Failed to create note. Please try again later.')
      console.error('Error creating note:', error)
    }
  })

  const [updateNote] = useMutation(UPDATE_DOG_NOTE, {
    onCompleted: () => {
      setShowCreateModal(false)
      setNoteContent('')
      setEditingNote(null)
      setError(null)
      refetch()
    },
    onError: (error) => {
      setError('Failed to update note. Please try again later.')
      console.error('Error updating note:', error)
    }
  })

  const [deleteNote] = useMutation(DELETE_DOG_NOTE, {
    onCompleted: () => {
      setError(null)
      refetch()
    },
    onError: (error) => {
      setError('Failed to delete note. Please try again later.')
      console.error('Error deleting note:', error)
    }
  })

  const handleCreateNote = async () => {
    if (!noteContent.trim()) return

    try {
      if (editingNote) {
        await updateNote({
          variables: {
            id: editingNote.id,
            content: noteContent.trim()
          }
        })
      } else {
        await createNote({
          variables: {
            input: {
              content: noteContent.trim(),
              dogId,
              clubId: selectedClub?.id || ''
            }
          }
        })
      }
    } catch (err) {
      // Error handled in onError
    }
  }

  const handleEditNote = (note: DogNote) => {
    setEditingNote(note)
    setNoteContent(note.content)
    setShowCreateModal(true)
  }

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId)
    setShowDeleteModal(true)
  }

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return

    try {
      await deleteNote({
        variables: { id: noteToDelete }
      })
      setShowDeleteModal(false)
      setNoteToDelete(null)
    } catch (err) {
      // Error handled in onError
    }
  }

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false)
    setNoteToDelete(null)
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    setEditingNote(null)
    setNoteContent('')
    setError(null)
  }

  const notes = data?.dogNotes || []

  if (loading) {
    return (
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Notes</h5>
        <Button
          variant="primary"
          size="sm"
          className="d-flex align-items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusLg className="me-1" />
          Add Note
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Notes</h5>
        <Button
          variant="primary"
          size="sm"
          className="d-flex align-items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusLg className="me-1" />
          Add Note
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {notes.length === 0 ? (
        <Alert variant="info text-center">
          No notes yet for {dogName}. <Link to="#" onClick={() => setShowCreateModal(true)}>Add your first note.</Link>
        </Alert>
      ) : (
        <div>
          {notes.map((note: DogNote) => (
                <div key={note.id} className="border rounded p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                      <small className="text-muted">
                        <Calendar3 className="me-1" />
                        {formatFullDateTime(note.createdAt)}
                        {note.updatedAt !== note.createdAt && (
                          <span className="ms-2">(edited)</span>
                        )}
                      </small>
                      <p className="m-0 mt-2">{note.content}</p>
                    </div>
                    <div className="d-flex gap-2">
                      {note.setDogNotes.length > 0 ? (
                        <Link
                          to={`/practices/${note.setDogNotes[0].setDog.set.practice.id}`}
                          className="btn btn-outline-primary btn-sm d-flex align-items-center"
                        >
                          Go to practice <ChevronRight />
                        </Link>
                      ) : (
                        <>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="d-flex align-items-center"
                            onClick={() => handleEditNote(note)}
                          >
                            <Pencil className="me-1" /> Update
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="d-flex align-items-center"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {note.setDogNotes.length > 0 && (
                    <div className="mt-3">
                      <SetViewOnly
                        sets={note.setDogNotes.map(setDogNote => ({
                          ...setDogNote.setDog.set,
                          __typename: 'Set' as const,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          locationId: setDogNote.setDog.set.location.id,
                          type: setDogNote.setDog.set.type as SetType | null,
                          dogs: setDogNote.setDog.set.dogs.map(dog => ({
                            ...dog,
                            __typename: 'SetDog' as const,
                            lane: dog.lane as Lane | null,
                            dog: {
                              ...dog.dog,
                              __typename: 'Dog' as const,
                              trainingLevel: dog.dog.trainingLevel as TrainingLevel,
                              owner: dog.dog.owner,
                            },
                          })),
                        }))}
                        defaultLocationName={note.setDogNotes[0].setDog.set.location.name}
                        twoColumns={false}
                        smallHeader={true}
                        hideNotes={true}
                        practiceScheduledAt={note.setDogNotes[0]?.setDog.set.practice.scheduledAt}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

      <Modal show={showCreateModal} onHide={handleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingNote ? 'Edit Note' : 'Add Note'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note about this dog..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateNote}
            disabled={!noteContent.trim()}
            className="d-flex align-items-center"
          >
            {editingNote ? (
              <>
                <CheckLg className="me-2" />
                Update Note
              </>
            ) : (
              <>
                <PlusLg className="me-2" />
                Create Note
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={handleDeleteModalClose}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmButtonText="Delete Note"
      />
    </>
  )
}

export default DogNotes
