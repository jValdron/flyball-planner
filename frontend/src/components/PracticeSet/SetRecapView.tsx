import { useState, useMemo, useEffect } from 'react'
import { Button, Form, Row, Col, Badge, Spinner } from 'react-bootstrap'
import { DashCircle, PlusLg, CheckSquareFill, Square, Save, HandThumbsUpFill, HandThumbsDownFill } from 'react-bootstrap-icons'
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
import type { GetPracticeQuery } from '../../graphql/generated/graphql'

type SetData = NonNullable<GetPracticeQuery['practice']>['sets'][0]
type DogData = NonNullable<GetPracticeQuery['practice']>['sets'][0]['dogs'][0]['dog']

interface SetRecapViewProps {
  sets: SetData[]
  dogs: DogData[]
  practiceId: string
  clubId: string
  defaultLocationName?: string
  onRatingChange?: (setId: string, rating: SetRating | null) => void
}

export function SetRecapView({ sets, dogs, practiceId, clubId, defaultLocationName, onRatingChange }: SetRecapViewProps) {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [updateSetRating] = useMutation(UPDATE_SET_RATING)
  const [createSetDogNote] = useMutation(CREATE_SET_DOG_NOTE)
  const [noteContents, setNoteContents] = useState<Record<string, string>>({})
  const [selectedDogs, setSelectedDogs] = useState<Record<string, string[]>>({})
  const [showNoteInput, setShowNoteInput] = useState<Record<string, boolean>>({})
  const [savingRatings, setSavingRatings] = useState<Record<string, SetRating>>({})
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({})

  const { data: practiceNotesData, refetch: refetchNotes } = useQuery(GET_DOG_NOTES_BY_PRACTICE, {
    variables: { practiceId: String(practiceId) },
    skip: !practiceId
  })

  const { data: dogNoteSubscriptionData } = usePracticeDogNoteChangedSubscription(practiceId)

  useEffect(() => {
    if (dogNoteSubscriptionData?.practiceDogNoteChanged) {
      const { eventType } = dogNoteSubscriptionData.practiceDogNoteChanged;

      if (eventType === 'CREATED' || eventType === 'UPDATED' || eventType === 'DELETED') {
        refetchNotes();
      }
    }
  }, [dogNoteSubscriptionData, refetchNotes]);

  const dogNotes = useMemo(() => {
    const notesBySet: Record<string, Array<{
      id: string
      content: string
      selectedDogs: string[]
      createdAt: string
      setDogs: Array<{
        dogId: string
        dog: {
          id: string
          name: string
          trainingLevel?: string
        }
      }>
    }>> = {}

    sets.forEach(set => {
      notesBySet[set.id] = []
    })

    if (practiceNotesData?.dogNotesByPractice) {
      practiceNotesData.dogNotesByPractice.forEach((note: any) => {
        const setId = note.setId
        if (notesBySet[setId]) {
          const set = sets.find(s => s.id === setId)
          const setDogs = note.dogIds.map((dogId: string) => {
            const setDog = set?.dogs.find((d: any) => d.dogId === dogId)
            return {
              dogId,
              dog: {
                id: setDog?.dog?.id || dogId,
                name: setDog?.dog?.name || `Dog ${dogId}`,
                trainingLevel: setDog?.dog?.trainingLevel
              }
            }
          })

          notesBySet[setId].push({
            id: note.id,
            content: note.content,
            selectedDogs: note.dogIds,
            createdAt: note.createdAt,
            setDogs
          })
        }
      })
    }

    return notesBySet
  }, [practiceNotesData, sets])

  const enrichedSets = useMemo(() => {
    return sets.map(set => ({
      ...set,
      dogs: set.dogs.map(setDog => ({
        ...setDog,
        dog: setDog.dog || dogs.find(dog => dog.id === setDog.dogId) || null
      }))
    }))
  }, [sets, dogs])

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

  const handleNoteContentChange = (setId: string, content: string) => {
    setNoteContents(prev => ({ ...prev, [setId]: content }))
  }

  const handleDogSelectionChange = (setId: string, dogId: string, isChecked: boolean) => {
    setSelectedDogs(prev => {
      const currentSelected = prev[setId] || []
      if (isChecked) {
        return { ...prev, [setId]: [...currentSelected, dogId] }
      } else {
        return { ...prev, [setId]: currentSelected.filter(id => id !== dogId) }
      }
    })
  }

  const handleAddNote = async (setId: string) => {
    const content = noteContents[setId]?.trim()
    const selectedDogIds = selectedDogs[setId] || []

    if (!content || selectedDogIds.length === 0) return

    try {
      setSavingNotes(prev => ({ ...prev, [setId]: true }))

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

      setNoteContents(prev => ({ ...prev, [setId]: '' }))
      setSelectedDogs(prev => ({ ...prev, [setId]: [] }))
      setShowNoteInput(prev => ({ ...prev, [setId]: false }))
    } catch (error) {
      console.error('Error creating note:', error)
    } finally {
      setSavingNotes(prev => ({ ...prev, [setId]: false }))
    }
  }

  const handleToggleNoteInput = (setId: string) => {
    setShowNoteInput(prev => ({ ...prev, [setId]: !prev[setId] }))
  }

  const handleDogBadgeClick = (dogId: string) => {
    navigate(`/dogs/${dogId}`)
  }

  const getRatingButtonVariant = (setId: string, currentRating: SetRating | null, targetRating: SetRating) => {
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

  const renderDogButton = (setDog: any, setId: string) => {
    const dogName = setDog.dog?.name || `Dog ${setDog.dogId || setDog.id}`
    const trainingLevel = setDog.dog?.trainingLevel
    const { variant: trainingVariant } = getTrainingLevelInfo(trainingLevel)
    const isSelected = selectedDogs[setId]?.includes(setDog.dogId || '') || false

    const buttonVariant = trainingVariant.replace('-subtle', '')

    return (
      <div key={setDog.id} className="w-100 mb-2">
        <Form.Check
          type="checkbox"
          id={`dog-${setDog.id}`}
          checked={isSelected}
          onChange={(e) => handleDogSelectionChange(setId, setDog.dogId || '', e.target.checked)}
          className="d-none"
        />
        <Button
          as="label"
          htmlFor={`dog-${setDog.id}`}
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

  const renderSetContent = (set: any) => (
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
              <div className="float-end d-flex gap-2 mb-2">
                <NoteEditor
                  note={note}
                  setDogs={note.setDogs}
                  onUpdate={refetchNotes}
                />
              </div>
              <p className="mb-0">{note.content}</p>
            </div>
            <div className="mt-2">
              <div className="mt-1">
                {note.selectedDogs.map(dogId => {
                  const setDog = set.dogs.find((d: any) => d.dogId === dogId)
                  const dogName = setDog?.dog?.name || `Dog ${dogId}`
                  const trainingLevel = setDog?.dog?.trainingLevel
                  const { variant } = getTrainingLevelInfo(trainingLevel)

                  return (
                    <Badge
                      key={dogId}
                      bg={variant}
                      className={`me-1 ${isDark ? '' : 'text-dark'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleDogBadgeClick(dogId)}
                    >
                      {dogName}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        {!showNoteInput[set.id] ? (
          <div className="d-flex justify-content-center">
            <Button
              variant="outline-primary"
              className="d-flex align-items-center"
              onClick={() => handleToggleNoteInput(set.id)}
            >
              <PlusLg className="me-2" /> New Note
            </Button>
          </div>
        ) : (
          <div className="border-top pt-3">
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
                            {leftDogs.map((setDog: any) => renderDogButton(setDog, set.id))}
                          </div>
                          <div className="col-6">
                            {rightDogs.map((setDog: any) => renderDogButton(setDog, set.id))}
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
                            {leftDogs.map((setDog: any) => renderDogButton(setDog, set.id))}
                          </div>
                          <div className="col-6">
                            {rightDogs.map((setDog: any) => renderDogButton(setDog, set.id))}
                          </div>
                        </>
                      )
                    }
                  })()}
                </div>
              </div>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Note for selected dogs..."
                  value={noteContents[set.id] || ''}
                  onChange={(e) => handleNoteContentChange(set.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                      e.preventDefault()
                      handleAddNote(set.id)
                    }
                  }}
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mt-2 d-flex align-items-center"
                  onClick={() => handleToggleNoteInput(set.id)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2 d-flex align-items-center"
                  onClick={() => handleAddNote(set.id)}
                  disabled={!noteContents[set.id]?.trim() || selectedDogs[set.id]?.length === 0 || savingNotes[set.id]}
                >
                  {savingNotes[set.id] ? (
                    <Spinner animation="border" size="sm" className="me-2" />
                  ) : (
                    <Save className="me-2" />
                  )}
                  Add Note
                </Button>
              </div>
            </Col>
          </Row>
          </div>
        )}
      </div>
    </>
  )

  return (
    <SetDisplayBase sets={enrichedSets} twoColumns={false} defaultLocationName={defaultLocationName} showTrainingLevels={true} clickableDogBadges={true}>
      {renderSetContent}
    </SetDisplayBase>
  )
}
