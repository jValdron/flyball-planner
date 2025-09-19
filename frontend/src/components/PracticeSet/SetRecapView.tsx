import { useState, useMemo, useEffect } from 'react'
import { Button, Form, Row, Col, Spinner, Modal, Alert } from 'react-bootstrap'
import { DashCircle, PlusLg, CheckSquareFill, Square, HandThumbsUpFill, HandThumbsDownFill, Calendar3 } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router-dom'
import { SetRating, Lane } from '../../graphql/generated/graphql'
import { useMutation, useQuery } from '@apollo/client'
import { UPDATE_SET_RATING } from '../../graphql/sets'
import { CREATE_SET_DOG_NOTE, GET_DOG_NOTES_BY_PRACTICE } from '../../graphql/dogNotes'
import { usePracticeDogNoteChangedSubscription } from '../../hooks/useSubscription'
import { SetDisplayBase } from './SetDisplayBase'
import { getTrainingLevelInfo } from '../../utils/trainingLevels'
import { useTheme } from '../../contexts/ThemeContext'
import { NoteEditor } from '../NoteEditor'
import DogBadge from '../DogBadge'
import type { Set, SetDog, PracticeDogNote } from '../../graphql/generated/graphql'
import { formatFullDateTime } from '../../utils/dateUtils'

interface SetRecapViewProps {
  sets: Set[]
  practiceId: string
  clubId: string
  onRatingChange?: (setId: string, rating: SetRating | null) => void
}

export function SetRecapView({ sets, practiceId, clubId, onRatingChange }: SetRecapViewProps) {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [updateSetRating] = useMutation(UPDATE_SET_RATING)
  const [createSetDogNote] = useMutation(CREATE_SET_DOG_NOTE)
  const [savingRatings, setSavingRatings] = useState<Record<string, SetRating>>({})
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({})
  const [showCreateModal, setShowCreateModal] = useState<Record<string, boolean>>({})
  const [modalNoteContent, setModalNoteContent] = useState<Record<string, string>>({})
  const [modalSelectedDogs, setModalSelectedDogs] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [localNotes, setLocalNotes] = useState<Record<string, PracticeDogNote[]>>({})

  const { data: practiceNotesData } = useQuery(GET_DOG_NOTES_BY_PRACTICE, {
    variables: { practiceId: String(practiceId) },
    skip: !practiceId
  })

  const { data: dogNoteSubscriptionData } = usePracticeDogNoteChangedSubscription(practiceId)

  useEffect(() => {
    if (practiceNotesData?.dogNotesByPractice) {
      const notesBySet: Record<string, PracticeDogNote[]> = {}
      sets.forEach(set => {
        notesBySet[set.id] = []
      })

      practiceNotesData.dogNotesByPractice.forEach((note: PracticeDogNote) => {
        const setId = note.setId
        if (notesBySet[setId]) {
          notesBySet[setId].push(note)
        }
      })

      setLocalNotes(notesBySet)
    }
  }, [practiceNotesData, sets])

  useEffect(() => {
    if (dogNoteSubscriptionData?.practiceDogNoteChanged) {
      const { eventType, id, content, setId, dogIds } = dogNoteSubscriptionData.practiceDogNoteChanged;

      setLocalNotes(prev => {
        const newNotes = { ...prev }

        if (!newNotes[setId]) {
          newNotes[setId] = []
        }

        switch (eventType) {
          case 'CREATED':
            newNotes[setId] = [...newNotes[setId], { id, content, dogIds, setId } as PracticeDogNote]
            break
          case 'UPDATED':
            newNotes[setId] = newNotes[setId].map(note =>
              note.id === id ? { ...note, content, dogIds } : note
            )
            break
          case 'DELETED':
            newNotes[setId] = newNotes[setId].filter(note => note.id !== id)
            break
        }

        return newNotes
      })
    }
  }, [dogNoteSubscriptionData]);

  const dogNotes = useMemo(() => {
    const notesBySet: Record<string, Array<{
      id: string
      content: string
      createdAt: string | null
      updatedAt: string | null,
      selectedDogs: string[],
      setDogs: SetDog[]
    }>> = {}

    sets.forEach(set => {
      notesBySet[set.id] = []
    })

    Object.entries(localNotes).forEach(([setId, notes]) => {
      notes.forEach((note: PracticeDogNote) => {
        if (notesBySet[setId]) {
          notesBySet[setId].push({
            id: note.id,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            selectedDogs: note.dogIds,
            setDogs: (sets.find(s => s.id === setId)?.dogs || []).filter(d => note.dogIds.includes(d.dogId || ''))
          })
        }
      })
    })

    return notesBySet
  }, [localNotes, sets])

  const handleRatingChange = async (setId: string, rating: SetRating | null) => {
    try {
      setSavingRatings(prev => ({ ...prev, [setId]: rating! }))
      await updateSetRating({
        variables: {
          updates: [{
            id: setId,
            rating
          }]
        }
      })
      onRatingChange?.(setId, rating)
    } catch (error) {
      console.error('Error updating set rating:', error)
    } finally {
      setSavingRatings(prev => {
        const { [setId]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleModalNoteContentChange = (setId: string, content: string) => {
    setModalNoteContent(prev => ({ ...prev, [setId]: content }))
  }

  const handleModalDogSelectionChange = (setId: string, dogId: string, isChecked: boolean) => {
    setModalSelectedDogs(prev => {
      const currentSelected = prev[setId] || []
      if (isChecked) {
        return { ...prev, [setId]: [...currentSelected, dogId] }
      } else {
        return { ...prev, [setId]: currentSelected.filter(id => id !== dogId) }
      }
    })
  }

  const handleAddNote = async (setId: string) => {
    const content = modalNoteContent[setId]?.trim()
    const selectedDogIds = modalSelectedDogs[setId] || []

    if (!content || selectedDogIds.length === 0) return

    try {
      setSavingNotes(prev => ({ ...prev, [setId]: true }))
      setError(null)

      const set = sets.find(s => s.id === setId)
      if (!set) return

      const firstSetDog = set.dogs.find(d => selectedDogIds.includes(d.dogId || ''))
      if (!firstSetDog) return

      await createSetDogNote({
        variables: {
          input: {
            content,
            setDogId: firstSetDog.id,
            dogIds: selectedDogIds,
            clubId
          }
        }
      })

      setModalNoteContent(prev => ({ ...prev, [setId]: '' }))
      setModalSelectedDogs(prev => ({ ...prev, [setId]: [] }))
      setShowCreateModal(prev => ({ ...prev, [setId]: false }))
    } catch (error) {
      setError('Failed to create note. Please try again later.')
      console.error('Error creating note:', error)
    } finally {
      setSavingNotes(prev => ({ ...prev, [setId]: false }))
    }
  }

  const handleToggleCreateModal = (setId: string) => {
    setShowCreateModal(prev => ({ ...prev, [setId]: !prev[setId] }))
    if (!showCreateModal[setId]) {
      setModalNoteContent(prev => ({ ...prev, [setId]: '' }))
      setModalSelectedDogs(prev => ({ ...prev, [setId]: [] }))
      setError(null)
    }
  }

  const handleModalClose = (setId: string) => {
    setShowCreateModal(prev => ({ ...prev, [setId]: false }))
    setModalNoteContent(prev => ({ ...prev, [setId]: '' }))
    setModalSelectedDogs(prev => ({ ...prev, [setId]: [] }))
    setError(null)
  }

  const handleDogBadgeClick = (dogId: string) => {
    navigate(`/dogs/${dogId}`)
  }

  const getRatingButtonVariant = (setId: string, currentRating: SetRating | undefined | null, targetRating: SetRating) => {
    const isSelected = currentRating === targetRating
    const isSaving = savingRatings[setId] === targetRating

    if (isSaving) {
      switch (targetRating) {
        case SetRating.Good: return 'success'
        case SetRating.Neutral: return 'secondary'
        case SetRating.Bad: return 'danger'
        default: return 'secondary'
      }
    }

    switch (targetRating) {
      case SetRating.Good: return isSelected ? 'success' : 'outline-success'
      case SetRating.Neutral: return isSelected ? 'secondary' : 'outline-secondary'
      case SetRating.Bad: return isSelected ? 'danger' : 'outline-danger'
      default: return 'outline-secondary'
    }
  }

  const renderDogButton = (setDog: any, setId: string, isModal: boolean = false) => {
    const dogName = setDog.dog?.name || `Dog ${setDog.dogId || setDog.id}`
    const trainingLevel = setDog.dog?.trainingLevel
    const { variant: trainingVariant } = getTrainingLevelInfo(trainingLevel)
    const isSelected = isModal
      ? modalSelectedDogs[setId]?.includes(setDog.dogId || '') || false
      : false

    const buttonVariant = trainingVariant.replace('-subtle', '')

    return (
      <div key={setDog.id} className="w-100 mb-2">
        <Form.Check
          type="checkbox"
          id={`dog-${setDog.id}-${isModal ? 'modal' : 'inline'}`}
          checked={isSelected}
          onChange={(e) => isModal
            ? handleModalDogSelectionChange(setId, setDog.dogId || '', e.target.checked)
            : () => {}
          }
          className="d-none"
        />
        <Button
          as="label"
          htmlFor={`dog-${setDog.id}-${isModal ? 'modal' : 'inline'}`}
          variant={isSelected ? buttonVariant : `outline-${buttonVariant}`}
          size="sm"
          className={`d-flex align-items-center w-100 ${isDark ? '' : 'text-dark'}`}
        >
          {isSelected ? (
            <CheckSquareFill className="me-2" size={14} />
          ) : (
            <Square className="me-2" size={14} />
          )}
          {dogName}
        </Button>
      </div>
    )
  }

  const renderSetContent = (set: Set) => (
    <>
      {/* Rating buttons */}
      <div className="mt-3 d-flex justify-content-between gap-2">
        <Button
          variant={getRatingButtonVariant(set.id, set.rating, SetRating.Good)}
          className="d-flex align-items-center justify-content-center flex-grow-1"
          onClick={() => handleRatingChange(set.id, set.rating === SetRating.Good ? null : SetRating.Good)}
          disabled={!!savingRatings[set.id]}
        >
          {savingRatings[set.id] === SetRating.Good ? (
            <Spinner animation="border" size="sm" className="me-1" />
          ) : (
            <HandThumbsUpFill className="me-1" />
          )}
          Good
        </Button>
        <Button
          variant={getRatingButtonVariant(set.id, set.rating, SetRating.Neutral)}
          className="d-flex align-items-center justify-content-center flex-grow-1"
          onClick={() => handleRatingChange(set.id, set.rating === SetRating.Neutral ? null : SetRating.Neutral)}
          disabled={!!savingRatings[set.id]}
        >
          {savingRatings[set.id] === SetRating.Neutral ? (
            <Spinner animation="border" size="sm" className="me-1" />
          ) : (
            <DashCircle className="me-1" />
          )}
          Neutral
        </Button>
        <Button
          variant={getRatingButtonVariant(set.id, set.rating, SetRating.Bad)}
          className="d-flex align-items-center justify-content-center flex-grow-1"
          onClick={() => handleRatingChange(set.id, set.rating === SetRating.Bad ? null : SetRating.Bad)}
          disabled={!!savingRatings[set.id]}
        >
          {savingRatings[set.id] === SetRating.Bad ? (
            <Spinner animation="border" size="sm" className="me-1" />
          ) : (
            <HandThumbsDownFill className="me-1" />
          )}
          Bad
        </Button>
      </div>

      {/* Notes section */}
      <div className="mt-3">
        {dogNotes[set.id]?.map((note) => (
          <div key={note.id} className="mb-3 p-3 border rounded">
            <div className="mb-2">
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
                    setDogs={note.setDogs}
                  />
                </div>
              </div>
              <p className="m-0 mt-2">{note.content}</p>
            </div>
            <div className="mt-3">
              {note.selectedDogs.map(dogId => {
                const setDog = set.dogs.find((d: any) => d.dogId === dogId)

                if (setDog?.dog) {
                  return (
                    <DogBadge
                      key={dogId}
                      dog={setDog.dog}
                      bgByTrainingLevel={true}
                      clickable={true}
                      onClick={() => handleDogBadgeClick(dogId)}
                    />
                  )
                }
              })}
            </div>
          </div>
        ))}

        <div className="d-flex justify-content-center">
          <Button
            variant="outline-primary"
            className="d-flex align-items-center"
            onClick={() => handleToggleCreateModal(set.id)}
          >
            <PlusLg className="me-2" /> New Note
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <SetDisplayBase sets={sets} twoColumns={false} showTrainingLevels={true} clickableDogBadges={true}>
        {renderSetContent}
      </SetDisplayBase>

      {/* Create Note Modals */}
      {sets.map(set => (
        <Modal
          key={`create-note-${set.id}`}
          show={showCreateModal[set.id] || false}
          onHide={() => handleModalClose(set.id)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Add Note for Set {set.index + 1}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
                {error}
              </Alert>
            )}

            <Row>
              <Col md={4}>
                <div className="mb-2">
                  <div className="row">
                    {(() => {
                      const allDogs = set.dogs.filter((d: any) => d.lane === null || d.lane === Lane.Left || d.lane === Lane.Right)
                      const hasDogsInLeftLane = set.dogs.some((d: any) => d.lane === Lane.Left)
                      const hasDogsInRightLane = set.dogs.some((d: any) => d.lane === Lane.Right)
                      const isDoubleLane = hasDogsInLeftLane && hasDogsInRightLane

                      if (isDoubleLane) {
                        const leftDogs = set.dogs.filter((d: any) => d.lane === Lane.Left)
                          .sort((a: any, b: any) => a.index - b.index)
                        const rightDogs = set.dogs.filter((d: any) => d.lane === Lane.Right)
                          .sort((a: any, b: any) => a.index - b.index)

                        return (
                          <>
                            <div className="col-6">
                              {leftDogs.map((setDog: any) => renderDogButton(setDog, set.id, true))}
                            </div>
                            <div className="col-6">
                              {rightDogs.map((setDog: any) => renderDogButton(setDog, set.id, true))}
                            </div>
                          </>
                        )
                      } else {
                        const sortedDogs = allDogs.sort((a: any, b: any) => a.index - b.index)
                        const midPoint = Math.ceil(sortedDogs.length / 2)
                        const leftDogs = sortedDogs.slice(0, midPoint)
                        const rightDogs = sortedDogs.slice(midPoint)

                        return (
                          <>
                            <div className="col-6">
                              {leftDogs.map((setDog: any) => renderDogButton(setDog, set.id, true))}
                            </div>
                            <div className="col-6">
                              {rightDogs.map((setDog: any) => renderDogButton(setDog, set.id, true))}
                            </div>
                          </>
                        )
                      }
                    })()}
                  </div>
                </div>
              </Col>
              <Col md={8}>
                <Form.Control
                  as="textarea"
                  placeholder="Enter your note about the selected dogs..."
                  value={modalNoteContent[set.id] || ''}
                  onChange={(e) => handleModalNoteContentChange(set.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                      e.preventDefault()
                      handleAddNote(set.id)
                    }
                  }}
                  className="mh-125-expand"
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => handleModalClose(set.id)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleAddNote(set.id)}
              disabled={!modalNoteContent[set.id]?.trim() || modalSelectedDogs[set.id]?.length === 0 || savingNotes[set.id]}
              className="d-flex align-items-center"
            >
              {savingNotes[set.id] ? (
                <Spinner animation="border" size="sm" className="me-2" />
              ) : (
                <PlusLg className="me-2" />
              )}
              Create Note
            </Button>
          </Modal.Footer>
        </Modal>
      ))}
    </>
  )
}
