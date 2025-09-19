import { useState, useMemo } from 'react'

import { Button, Spinner } from 'react-bootstrap'
import { DashCircle, HandThumbsUpFill, HandThumbsDownFill } from 'react-bootstrap-icons'
import { useMutation, useQuery } from '@apollo/client'

import type { Set, DogNote, PracticeDogNote } from '../../graphql/generated/graphql'
import { SetRating } from '../../graphql/generated/graphql'
import { UPDATE_SET_RATING } from '../../graphql/sets'
import { GET_DOG_NOTES_BY_PRACTICE, CREATE_SET_DOG_NOTE, UPDATE_DOG_NOTE, DELETE_DOG_NOTE } from '../../graphql/dogNotes'
import { SetDisplayBase } from './SetDisplayBase'
import DogNotes from '../DogNotes'

interface SetRecapViewProps {
  sets: Set[]
  practiceId: string
  clubId: string
  onRatingChange?: (setId: string, rating: SetRating | null) => void
}

export function SetRecapView({ sets, practiceId, clubId, onRatingChange }: SetRecapViewProps) {
  const [updateSetRating] = useMutation(UPDATE_SET_RATING)
  const [savingRatings, setSavingRatings] = useState<Record<string, SetRating>>({})

  const { data: notesData, loading: notesLoading, error: notesError, refetch: refetchNotes } = useQuery(GET_DOG_NOTES_BY_PRACTICE, {
    variables: { practiceId, orderBy: 'createdAt_DESC' },
    skip: !practiceId,
    onError: (error) => {
      console.error('Error loading notes:', error)
    }
  })

  const notesBySet = useMemo(() => {
    const notesBySet: Record<string, DogNote[]> = {}

    sets.forEach(set => {
      notesBySet[set.id] = []
    })

    if (notesData?.dogNotesByPractice) {
      notesData.dogNotesByPractice.forEach((note: PracticeDogNote) => {
        const setId = note.setId
        if (notesBySet[setId]) {
          const set = sets.find(s => s.id === setId)
          notesBySet[setId].push({
            id: note.id,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            dog: {} as any,
            dogId: '',
            clubId: clubId,
            setDogs: (set?.dogs || []).filter(d => note.dogIds.includes(d.dogId || '')),
            setDogNotes: []
          } as DogNote)
        }
      })
    }

    return notesBySet
  }, [notesData?.dogNotesByPractice, sets, clubId])

  // Create note mutation
  const [createNote] = useMutation(CREATE_SET_DOG_NOTE, {
    onError: (error) => {
      console.error('Error creating note:', error)
    }
  })

  // Update note mutation
  const [updateNote] = useMutation(UPDATE_DOG_NOTE, {
    onError: (error) => {
      console.error('Error updating note:', error)
    }
  })

  // Delete note mutation
  const [deleteNote] = useMutation(DELETE_DOG_NOTE, {
    onError: (error) => {
      console.error('Error deleting note:', error)
    }
  })

  const handleCreateNote = async (content: string, setDogId: string, dogIds: string[]) => {
    try {
      await createNote({
        variables: {
          input: {
            content: content.trim(),
            setDogId,
            dogIds,
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
        <DogNotes
          notes={notesBySet[set.id] || [] as DogNote[]}
          setDogs={set.dogs}
          isDoubleLane={set.location?.isDoubleLane || false}
          practiceId={practiceId}
          onEditNote={(note) => handleUpdateNote(note.id, note.content)}
          onDeleteNote={handleDeleteNote}
          onCreateNote={(content, _, setDogId, dogIds) => {
            if (setDogId && dogIds) {
              handleCreateNote(content, setDogId, dogIds)
            }
          }}
          onNoteChanged={() => refetchNotes()}
          showCreateButton
          showSetView={false}
          showNoNotesAlert={false}
          loading={notesLoading}
          error={notesError?.message || null}
        />
      </div>
    </>
  )

  return (
    <SetDisplayBase
      sets={sets}
      twoColumns={false}
      showTrainingLevels
      clickableDogBadges
      defaultLocationName={sets[0]?.location?.name}
    >
      {renderSetContent}
    </SetDisplayBase>
  )
}
