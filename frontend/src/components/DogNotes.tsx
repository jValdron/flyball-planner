import { useState } from 'react'

import { Button, Form, Alert, Modal, Card, CardGroup } from 'react-bootstrap'
import { PlusLg, Calendar3, ChevronRight, Pencil, Trash, CheckSquareFill, Square } from 'react-bootstrap-icons'
import { useSubscription } from '@apollo/client'
import { Link } from 'react-router-dom'

import type { Dog, SetDog, Set, DogNote } from '../graphql/generated/graphql'
import { Lane, TrainingLevel } from '../graphql/generated/graphql'
import { formatFullDateTime } from '../utils/dateUtils'
import { getTrainingLevelInfo } from '../utils/trainingLevels'
import { DOG_NOTE_CHANGED, PRACTICE_DOG_NOTE_CHANGED } from '../graphql/dogNotes'
import { SetViewOnly } from './PracticeSet/SetViewOnly'
import DogBadge from './DogBadge'
import DeleteConfirmationModal from './DeleteConfirmationModal'

interface DogNotesProps {
  notes: DogNote[]
  dog?: Partial<Dog> & { id: string, name: string }
  setDogs?: SetDog[]
  isDoubleLane?: boolean
  practiceId?: string

  onEditNote?: (note: { id: string, content: string }) => void
  onDeleteNote?: (noteId: string) => void
  onCreateNote?: (content: string, clubId: string, setDogId?: string, dogIds?: string[]) => void
  onNoteChanged?: () => void

  showCreateButton?: boolean
  showSetView?: boolean
  showNoNotesAlert?: boolean
  className?: string
  loading?: boolean
  error?: string | null
}

function DogNotes({
  notes,
  dog,
  setDogs = [],
  isDoubleLane = false,
  practiceId,
  onEditNote,
  onDeleteNote,
  onCreateNote,
  onNoteChanged,
  showCreateButton = true,
  showSetView = true,
  showNoNotesAlert = true,
  className = '',
  loading = false,
  error
}: DogNotesProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [editingNote, setEditingNote] = useState<{ id: string, content: string } | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [selectedDogs, setSelectedDogs] = useState<string[]>([])

  const isPracticeMode = setDogs.length > 0
  const isDogMode = !!dog

  // Subscribe to note changes based on mode
  useSubscription(DOG_NOTE_CHANGED, {
    variables: { dogId: dog?.id || '' },
    skip: !isDogMode || !dog?.id,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.dogNoteChanged) {
        onNoteChanged?.()
      }
    },
    onError: (error) => {
      console.error('Dog note subscription error:', error)
    }
  })

  useSubscription(PRACTICE_DOG_NOTE_CHANGED, {
    variables: { practiceId: practiceId || '' },
    skip: !isPracticeMode || !practiceId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.practiceDogNoteChanged) {
        onNoteChanged?.()
      }
    },
    onError: (error) => {
      console.error('Practice dog note subscription error:', error)
    }
  })

  const handleEditClick = (note: { id: string, content: string }) => {
    setEditingNote(note)
    setNoteContent(note.content)
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!noteContent.trim() || !editingNote) return

    try {
      onEditNote?.({
        id: editingNote.id,
        content: noteContent.trim()
      })
      setShowEditModal(false)
      setEditingNote(null)
      setNoteContent('')
    } catch (err) {
      console.error('Error updating note:', err)
    }
  }

  const handleDeleteClick = (noteId: string) => {
    setEditingNote({ id: noteId, content: '' })
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!editingNote) return

    try {
      onDeleteNote?.(editingNote.id)
      setShowDeleteModal(false)
      setEditingNote(null)
    } catch (err) {
      console.error('Error deleting note:', err)
    }
  }

  const handleEditModalClose = () => {
    setShowEditModal(false)
    setEditingNote(null)
    setNoteContent('')
  }

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false)
    setEditingNote(null)
  }

  const handleCreateClick = () => {
    setSelectedDogs([])
    setShowCreateModal(true)
  }

  const handleDogSelectionChange = (dogId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedDogs(prev => [...prev, dogId])
    } else {
      setSelectedDogs(prev => prev.filter(id => id !== dogId))
    }
  }

  const handleCreateNoteSubmit = async () => {
    if (!noteContent.trim() || !onCreateNote) return

    try {
      setCreateError(null)

      if (isDogMode && dog) {
        await onCreateNote(noteContent.trim(), dog.clubId || '')
      } else if (isPracticeMode && selectedDogs.length > 0) {
        const firstSetDog = setDogs.find(d => selectedDogs.includes(d.dogId || ''))
        if (!firstSetDog) return

        await onCreateNote(
          noteContent.trim(),
          firstSetDog.set?.practice?.clubId || '',
          firstSetDog.id,
          selectedDogs
        )
      }

      setShowCreateModal(false)
      setNoteContent('')
      setSelectedDogs([])
    } catch (err) {
      setCreateError('Failed to create note. Please try again later.')
      console.error('Error creating note:', err)
    }
  }

  const handleCreateModalClose = () => {
    setShowCreateModal(false)
    setNoteContent('')
    setSelectedDogs([])
    setCreateError(null)
  }

  if (loading) {
    return (
      <div className={`d-flex justify-content-between align-items-center mb-3 ${className}`}>
        <h4 className="mb-0">Notes</h4>
        {showCreateButton && (
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center"
            onClick={handleCreateClick}
          >
            <PlusLg className="me-1" />
            Add Note
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className={`d-flex justify-content-center align-items-center ${className}`}>
        {showCreateButton && (
          <Button
            variant="primary"
            className="d-flex align-items-center"
            onClick={handleCreateClick}
          >
            <PlusLg className="me-1" />
            Add Note
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-3" onClose={() => {}} dismissible>
          {error}
        </Alert>
      )}

      {!notes || notes.length === 0 ? (
        showNoNotesAlert ? (
          <Alert variant="info text-center mt-3">
            No notes yet{dog ? ` for ${dog.name}` : ''}.
            {showCreateButton && (
              <Link to="#" onClick={handleCreateClick} className="ms-1">Add your first note.</Link>
            )}
          </Alert>
        ) : null
      ) : (
        <div>
          {notes?.map((note) => (
            <CardGroup key={note.id} className="my-3 flex-column">
              <Card className="rounded-bottom-0">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <Calendar3 className="me-2 text-muted" size={14} />
                    <small className="text-muted">
                      {formatFullDateTime(note.createdAt)}
                      {note.updatedAt !== note.createdAt && (
                        <span className="ms-2">(edited)</span>
                      )}
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="d-flex align-items-center"
                      onClick={() => handleEditClick({ id: note.id, content: note.content })}
                    >
                      <Pencil className="me-1" size={12} />
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="d-flex align-items-center"
                      onClick={() => handleDeleteClick(note.id)}
                    >
                      <Trash size={12} />
                    </Button>
                    {note.setDogNotes && note.setDogNotes.length > 0 && (
                      <Link
                        to={`/practices/${note.setDogNotes[0].setDog.set.practice.id}/sets?focusSet=${note.setDogNotes[0].setDog.set.id}`}
                        className="btn btn-outline-primary btn-sm d-flex align-items-center text-nowrap"
                      >
                        Go to practice <ChevronRight className="ms-1" />
                      </Link>
                    )}
                  </div>
                </Card.Header>

                <Card.Body>
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>

                  {!isDogMode && note.setDogs && note.setDogs.length > 0 && (
                    <div className="mt-3 d-flex flex-wrap gap-1">
                      {note.setDogs.sort((a, b) => a.dog.name.localeCompare(b.dog.name)).map((setDog) => (
                        <DogBadge key={setDog.dogId} dog={setDog.dog} bgByTrainingLevel clickable />
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
              {showSetView && note.setDogNotes && note.setDogNotes.length > 0 && (
                <SetViewOnly
                  sets={note.setDogNotes.map(setDogNote => setDogNote.setDog.set as Set)}
                  defaultLocationName={note.setDogNotes[0].setDog.set.location.name}
                  twoColumns={false}
                  smallHeader
                  hideNotes
                  practiceScheduledAt={note.setDogNotes[0]?.setDog.set.practice.scheduledAt}
                  clickableDogBadges
                  showTrainingLevels
                  clickableSets
                  practiceId={note.setDogNotes[0].setDog.set.practice.id}
                  cardClassName="rounded-top-0 border-top-0"
                />
              )}
            </CardGroup>
          ))}
        </div>
      )}

      {/* Edit Note Modal */}
      <Modal show={showEditModal} onHide={handleEditModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <small className="text-muted d-flex align-items-center">
              <Calendar3 className="me-2" />
              {editingNote && formatFullDateTime(notes.find(n => n.id === editingNote.id)?.createdAt || null)}
              {editingNote && notes.find(n => n.id === editingNote.id)?.updatedAt !== notes.find(n => n.id === editingNote.id)?.createdAt && (
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
                placeholder="Enter your note..."
              />
            </Form.Group>
          </Form>
          {!isDogMode && editingNote && notes.find(n => n.id === editingNote.id)?.setDogs && (notes.find(n => n.id === editingNote.id)?.setDogs?.length || 0) > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-muted">
                <small className="me-2">
                  {(notes.find(n => n.id === editingNote.id)?.setDogs?.length || 0) === 1 ? 'This note is tied to a single dog:' : 'This note is tied to the following dogs:'}
                </small>
                {notes.find(n => n.id === editingNote.id)?.setDogs?.map((setDog) => (
                  <DogBadge key={setDog.dogId} dog={setDog.dog} bgByTrainingLevel className="ms-1" />
                ))}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleEditModalClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={!noteContent.trim()}
            className="d-flex align-items-center"
          >
            <Pencil className="me-2" />
            Update Note
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Note Modal */}
      <Modal show={showCreateModal} onHide={handleCreateModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && (
            <Alert variant="danger" className="mb-3" onClose={() => setCreateError(null)} dismissible>
              {createError}
            </Alert>
          )}

          <div className="row">
            {isPracticeMode && setDogs.length > 0 && (
              <div className="col-4">
                {(() => {
                  let leftColumnDogs: SetDog[]
                  let rightColumnDogs: SetDog[]

                  if (isDoubleLane) {
                    const leftLaneDogs = setDogs.filter(d => d.lane === Lane.Left).sort((a, b) => a.index - b.index)
                    const rightLaneDogs = setDogs.filter(d => d.lane === Lane.Right).sort((a, b) => a.index - b.index)

                    if (leftLaneDogs.length > 4 && rightLaneDogs.length === 0) {
                      const midPoint = Math.ceil(leftLaneDogs.length / 2)
                      leftColumnDogs = leftLaneDogs.slice(0, midPoint)
                      rightColumnDogs = leftLaneDogs.slice(midPoint)
                    } else if (rightLaneDogs.length > 4 && leftLaneDogs.length === 0) {
                      const midPoint = Math.ceil(rightLaneDogs.length / 2)
                      leftColumnDogs = rightLaneDogs.slice(0, midPoint)
                      rightColumnDogs = rightLaneDogs.slice(midPoint)
                    } else {
                      leftColumnDogs = leftLaneDogs
                      rightColumnDogs = rightLaneDogs
                    }
                  } else {
                    const sortedDogs = [...setDogs].sort((a, b) => a.index - b.index)
                    const midPoint = Math.ceil(sortedDogs.length / 2)
                    leftColumnDogs = sortedDogs.slice(0, midPoint)
                    rightColumnDogs = sortedDogs.slice(midPoint)
                  }

                  return (
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="d-flex flex-column gap-1">
                          {leftColumnDogs.map((setDog) => (
                            <Button
                              key={setDog.id}
                              variant={(() => {
                                const { fullVariant } = getTrainingLevelInfo(setDog.dog?.trainingLevel || TrainingLevel.Beginner)
                                return selectedDogs.includes(setDog.dogId || '') ? fullVariant : `outline-${fullVariant}`
                              })()}
                              size="sm"
                              className="d-flex align-items-center justify-content-start"
                              onClick={() => handleDogSelectionChange(setDog.dogId || '', !selectedDogs.includes(setDog.dogId || ''))}
                            >
                              {selectedDogs.includes(setDog.dogId || '') ? (
                                <CheckSquareFill size={16} className="me-2" />
                              ) : (
                                <Square size={16} className="me-2" />
                              )}
                              {setDog.dog?.name || `Dog ${setDog.dogId}`}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex flex-column gap-1">
                          {rightColumnDogs.map((setDog) => (
                            <Button
                              key={setDog.id}
                              variant={(() => {
                                const { fullVariant } = getTrainingLevelInfo(setDog.dog?.trainingLevel || TrainingLevel.Beginner)
                                return selectedDogs.includes(setDog.dogId || '') ? fullVariant : `outline-${fullVariant}`
                              })()}
                              size="sm"
                              className="d-flex align-items-center justify-content-start"
                              onClick={() => handleDogSelectionChange(setDog.dogId || '', !selectedDogs.includes(setDog.dogId || ''))}
                            >
                              {selectedDogs.includes(setDog.dogId || '') ? (
                                <CheckSquareFill size={16} className="me-2" />
                              ) : (
                                <Square size={16} className="me-2" />
                              )}
                              {setDog.dog?.name || `Dog ${setDog.dogId}`}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            <div className={isPracticeMode && setDogs.length > 0 ? "col-8" : "col-12"}>
              <Form>
                <Form.Group>
                  <Form.Control
                    as="textarea"
                    className="mh-125-expand"
                    rows={4}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.ctrlKey && e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateNoteSubmit()
                      }
                    }}
                    placeholder={isDogMode ? "Enter your note about this dog..." : "Enter your note about the selected dogs..."}
                  />
                </Form.Group>
              </Form>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCreateModalClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateNoteSubmit}
            disabled={!noteContent.trim() || (isPracticeMode && selectedDogs.length === 0)}
            className="d-flex align-items-center"
          >
            <PlusLg className="me-2" />
            Add Note
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={handleDeleteModalClose}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmButtonText="Delete Note"
      />
    </>
  )
}

export default DogNotes