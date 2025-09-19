import { useState } from 'react'
import { Button, Form, Alert, Modal } from 'react-bootstrap'
import { PlusLg, Calendar3, ChevronRight } from 'react-bootstrap-icons'
import { useQuery, useMutation } from '@apollo/client'
import { GET_DOG_NOTES, CREATE_DOG_NOTE } from '../graphql/dogNotes'
import type { Dog, SetDog, Set, DogNote } from '../graphql/generated/graphql'
import { formatFullDateTime } from '../utils/dateUtils'
import { Link } from 'react-router-dom'
import { useClub } from '../contexts/ClubContext'
import { SetViewOnly } from './PracticeSet/SetViewOnly'
import { NoteEditor } from './NoteEditor'
import { enrichDogs } from '../utils/dogsUtils'

interface DogNotesProps {
  dog: Partial<Dog> & { id: string }
}

function DogNotes({ dog }: DogNotesProps) {
  const { selectedClub, dogs } = useClub()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data, loading, refetch } = useQuery(GET_DOG_NOTES, {
    variables: { dogId: dog.id },
    onError: (error) => {
      setError('Failed to load notes. Please try again later.')
      console.error('Error loading notes:', error)
    }
  })

  const [createNote] = useMutation(CREATE_DOG_NOTE, {
    onCompleted: () => {
      setShowCreateModal(false)
      setNoteContent('')
      setError(null)
      refetch()
    },
    onError: (error) => {
      setError('Failed to create note. Please try again later.')
      console.error('Error creating note:', error)
    }
  })



  const handleCreateNote = async () => {
    if (!noteContent.trim()) return

    try {
      await createNote({
        variables: {
          input: {
            content: noteContent.trim(),
            dogId: dog.id,
            clubId: selectedClub?.id || ''
          }
        }
      })
    } catch (err) {
      // Error handled in onError
    }
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    setNoteContent('')
    setError(null)
  }

  const notes = enrichDogs(data?.dogNotes as DogNote[] || [], dogs)

  if (loading) {
    return (
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Notes</h4>
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
        <h4 className="mb-0">Notes</h4>
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
          No notes yet for {dog.name}. <Link to="#" onClick={() => setShowCreateModal(true)}>Add your first note.</Link>
        </Alert>
      ) : (
        <div>
          {notes.map((note) => (
            <div key={note.id} className="border rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="flex-grow-1">
                  <small className="text-muted d-flex align-items-center">
                    <Calendar3 className="me-2" />
                    {formatFullDateTime(note.createdAt)}
                    {note.updatedAt !== note.createdAt && (
                      <span className="ms-2">(edited)</span>
                    )}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <NoteEditor
                    note={note}
                    setDogs={note.setDogs as SetDog[]}
                    onUpdate={refetch}
                  />
                  {note.setDogNotes && note.setDogNotes.length > 0 && (
                    <Link
                      to={`/practices/${note.setDogNotes[0].setDog.set.practice.id}/sets?focusSet=${note.setDogNotes[0].setDog.set.id}`}
                      className="btn btn-outline-primary btn-sm d-flex align-items-center text-nowrap"
                    >
                      Go to practice <ChevronRight className="ms-1" />
                    </Link>
                  )}
                </div>
              </div>

              <p className="m-0 mt-2">{note.content}</p>

              {note.setDogNotes && note.setDogNotes.length > 0 && (
                <div className="mt-3">
                  <SetViewOnly
                    sets={note.setDogNotes.map(setDogNote => setDogNote.setDog.set as Set)}
                    defaultLocationName={note.setDogNotes[0].setDog.set.location.name}
                    twoColumns={false}
                    smallHeader={true}
                    hideNotes={true}
                    practiceScheduledAt={note.setDogNotes[0]?.setDog.set.practice.scheduledAt}
                    clickableDogBadges={true}
                    showTrainingLevels={true}
                    clickableSets={true}
                    practiceId={note.setDogNotes[0].setDog.set.practice.id}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal show={showCreateModal} onHide={handleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                    handleCreateNote()
                  }
                }}
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
            <PlusLg className="me-2" />
            Create Note
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default DogNotes
