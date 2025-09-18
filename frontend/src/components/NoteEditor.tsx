import { useState } from 'react'
import { Button, Form, Modal, Badge } from 'react-bootstrap'
import { Pencil, Trash, Calendar3 } from 'react-bootstrap-icons'
import { useMutation } from '@apollo/client'
import { UPDATE_DOG_NOTE, DELETE_DOG_NOTE } from '../graphql/dogNotes'
import { getTrainingLevelInfo } from '../utils/trainingLevels'
import { formatFullDateTime } from '../utils/dateUtils'
import { TrainingLevel } from '../graphql/generated/graphql'
import DeleteConfirmationModal from './DeleteConfirmationModal'

interface SetDog {
  dogId: string
  dog: {
    id: string
    name: string
    trainingLevel?: string
  }
}

interface NoteEditorProps {
  note: {
    id: string
    content: string
    createdAt: string
    updatedAt: string | null
  }
  setDogs?: SetDog[]
  onUpdate?: () => void
  buttonVariant?: string
  buttonSize?: 'sm' | 'lg'
  buttonClassName?: string
  modalTitle?: string
  placeholder?: string
}

export function NoteEditor({
  note,
  setDogs,
  onUpdate,
  buttonVariant = 'outline-secondary',
  buttonSize = 'sm',
  buttonClassName = 'd-flex align-items-center',
  modalTitle = 'Edit Note',
  placeholder = 'Enter your note...'
}: NoteEditorProps) {
  const [showModal, setShowModal] = useState(false)
  const [noteContent, setNoteContent] = useState(note.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [updateNote] = useMutation(UPDATE_DOG_NOTE, {
    onCompleted: () => {
      setShowModal(false)
      setNoteContent(note.content)
      onUpdate?.()
    },
    onError: (error) => {
      console.error('Error updating note:', error)
    }
  })

  const [deleteNote] = useMutation(DELETE_DOG_NOTE, {
    onCompleted: () => {
      setShowDeleteModal(false)
      onUpdate?.()
    },
    onError: (error) => {
      console.error('Error deleting note:', error)
    }
  })

  const handleEditClick = () => {
    setNoteContent(note.content)
    setShowModal(true)
  }

  const handleUpdate = async () => {
    if (!noteContent.trim()) return

    try {
      setIsUpdating(true)
      await updateNote({
        variables: {
          id: note.id,
          content: noteContent.trim()
        }
      })
    } catch (error) {
      // Error handled in onError
    } finally {
      setIsUpdating(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setNoteContent(note.content)
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteNote({
        variables: { id: note.id }
      })
    } catch (error) {
      // Error handled in onError
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false)
  }


  return (
    <>
      <div className="d-flex gap-2">
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={buttonClassName}
          onClick={handleEditClick}
          disabled={isUpdating || isDeleting}
        >
          <Pencil className="me-1" size={12} />
          Update
        </Button>
        <Button
          variant="outline-danger"
          size={buttonSize}
          className={buttonClassName}
          onClick={handleDeleteClick}
          disabled={isUpdating || isDeleting}
        >
          <Trash className="me-1" size={12} />
          Delete
        </Button>
      </div>

      <Modal show={showModal} onHide={handleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <small className="text-muted d-flex align-items-center">
              <Calendar3 className="me-2" />
              {formatFullDateTime(note.createdAt)}
              {note.updatedAt !== note.createdAt && (
                <span className="ms-2">(edited)</span>
              )}
            </small>
          </div>
          <Form>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault()
                    handleUpdate()
                  }
                }}
                placeholder={placeholder}
              />
            </Form.Group>
          </Form>
          {setDogs && setDogs.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-muted">
                This note is tied to the following dogs:
              </p>
              <div className="d-flex flex-wrap gap-1">
                {setDogs.map((setDog) => {
                const { variant } = getTrainingLevelInfo((setDog.dog.trainingLevel as TrainingLevel) || TrainingLevel.Novice)
                return (
                  <Badge key={setDog.dogId} bg={variant} className="me-1">
                  {setDog.dog.name}
                  </Badge>
                )
                })}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={!noteContent.trim() || isUpdating}
            className="d-flex align-items-center"
          >
            <Pencil className="me-2" />
            {isUpdating ? 'Updating...' : `Update${setDogs && setDogs.length > 0 ? ` for ${setDogs.length} dog${setDogs.length === 1 ? '' : 's'}` : ''}`}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={handleDeleteModalClose}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmButtonText={isDeleting ? 'Deleting...' : 'Delete Note'}
      />
    </>
  )
}
