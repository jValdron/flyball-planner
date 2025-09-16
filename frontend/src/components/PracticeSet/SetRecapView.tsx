import { useState } from 'react'
import { Button, Form, Row, Col, Badge } from 'react-bootstrap'
import { CheckLg, XCircle, DashCircle, PlusLg, CheckSquareFill, Square, Save, Trash, X } from 'react-bootstrap-icons'
import { SetRating, Lane } from '../../graphql/generated/graphql'
import { useMutation } from '@apollo/client'
import { UPDATE_SET_RATING } from '../../graphql/sets'
import { SetDisplayBase } from './SetDisplayBase'
import { getTrainingLevelInfo } from '../../utils/trainingLevels'
import type { GetPracticeQuery } from '../../graphql/generated/graphql'

type SetData = NonNullable<GetPracticeQuery['practice']>['sets'][0]

interface SetRecapViewProps {
  sets: SetData[]
  defaultLocationName?: string
  onRatingChange?: (setId: string, rating: SetRating | null) => void
}

export function SetRecapView({ sets, defaultLocationName, onRatingChange }: SetRecapViewProps) {
  const [updateSetRating] = useMutation(UPDATE_SET_RATING)
  const [noteContents, setNoteContents] = useState<Record<string, string>>({})
  const [selectedDogs, setSelectedDogs] = useState<Record<string, string[]>>({})
  const [dogNotes, setDogNotes] = useState<Record<string, Array<{
    id: string
    content: string
    selectedDogs: string[]
  }>>>({})
  const [showNoteInput, setShowNoteInput] = useState<Record<string, boolean>>({})

  const handleRatingChange = async (setId: string, rating: SetRating | null) => {
    try {
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

  const handleAddNote = (setId: string) => {
    const content = noteContents[setId]?.trim()
    const selectedDogIds = selectedDogs[setId] || []

    if (!content || selectedDogIds.length === 0) return

    const newNote = {
      id: `${setId}-${Date.now()}`,
      content,
      selectedDogs: selectedDogIds
    }

    setDogNotes(prev => ({
      ...prev,
      [setId]: [...(prev[setId] || []), newNote]
    }))

    setNoteContents(prev => ({ ...prev, [setId]: '' }))
    setSelectedDogs(prev => ({ ...prev, [setId]: [] }))
    setShowNoteInput(prev => ({ ...prev, [setId]: false }))
  }

  const handleToggleNoteInput = (setId: string) => {
    setShowNoteInput(prev => ({ ...prev, [setId]: !prev[setId] }))
  }

  const handleDeleteNote = (setId: string, noteId: string) => {
    setDogNotes(prev => ({
      ...prev,
      [setId]: (prev[setId] || []).filter(note => note.id !== noteId)
    }))
  }

  const getRatingButtonVariant = (currentRating: SetRating | null, targetRating: SetRating) => {
    const isSelected = currentRating === targetRating
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
          className="d-flex align-items-center w-100"
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
          variant={getRatingButtonVariant(set.rating, SetRating.Good)}
          className="d-flex align-items-center justify-content-center flex-grow-1"
          onClick={() => handleRatingChange(set.id, set.rating === SetRating.Good ? null : SetRating.Good)}
        >
          <CheckLg className="me-1" />
          Good
        </Button>
        <Button
          variant={getRatingButtonVariant(set.rating, SetRating.Neutral)}
          className="d-flex align-items-center justify-content-center flex-grow-1"
          onClick={() => handleRatingChange(set.id, set.rating === SetRating.Neutral ? null : SetRating.Neutral)}
        >
          <DashCircle className="me-1" />
          Neutral
        </Button>
        <Button
          variant={getRatingButtonVariant(set.rating, SetRating.Bad)}
          className="d-flex align-items-center justify-content-center flex-grow-1"
          onClick={() => handleRatingChange(set.id, set.rating === SetRating.Bad ? null : SetRating.Bad)}
        >
          <XCircle className="me-1" />
          Bad
        </Button>
      </div>

      {/* Notes section */}
      <div className="mt-3">
        {dogNotes[set.id]?.map((note) => (
          <div key={note.id} className="mb-3 p-3 border rounded">
            <div className="mb-2">
              <Button
                variant="outline-danger"
                size="sm"
                className="float-end ms-2 mb-2 d-flex align-items-center"
                onClick={() => handleDeleteNote(set.id, note.id)}
              >
                <Trash className="me-1" size={12} />
                Delete
              </Button>
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
                    <Badge key={dogId} bg={variant} className={`me-1`}>
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
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mt-2 d-flex align-items-center"
                  onClick={() => handleToggleNoteInput(set.id)}
                >
                  <X className="me-1" size={12} />
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2 d-flex align-items-center"
                  onClick={() => handleAddNote(set.id)}
                  disabled={!noteContents[set.id]?.trim() || selectedDogs[set.id]?.length === 0}
                >
                  <Save className="me-2" /> Add Note
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
    <SetDisplayBase sets={sets} twoColumns={false} defaultLocationName={defaultLocationName} showTrainingLevels={true}>
      {renderSetContent}
    </SetDisplayBase>
  )
}
