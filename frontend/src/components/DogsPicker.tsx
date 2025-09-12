import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Form, Badge, Overlay, Popover, Button, CloseButton, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { GripVertical, ExclamationTriangle } from 'react-bootstrap-icons'
import TrainingLevelBadge from './TrainingLevelBadge'
import { getTrainingLevelInfo } from '../utils/trainingLevels'
import { useTheme } from '../contexts/ThemeContext'
import { useClub } from '../contexts/ClubContext'
import type { Dog, SetDog } from '../graphql/generated/graphql'
import type { ValidationError } from '../services/practiceValidation'

interface DogWithSetCount extends Dog {
  setCount: number
}

interface DogsPickerProps {
  value: SetDog[]
  onChange: (dogs: Partial<SetDog>[]) => void
  availableDogs: DogWithSetCount[]
  placeholder?: string
  disabled?: boolean
  dogsWithValidationIssues?: Set<string>
  validationErrors?: ValidationError[]
  getValidationErrorsForSet?: (setId: string) => ValidationError[]
  currentSetId?: string
}

export function DogsPicker({ value, onChange, availableDogs, placeholder = 'Add dog...', disabled = false, dogsWithValidationIssues, validationErrors, getValidationErrorsForSet, currentSetId }: DogsPickerProps) {
  const { isDark } = useTheme()
  const { selectedClub } = useClub()
  const idealSetsPerDog = selectedClub?.idealSetsPerDog ?? 2
  const [showInput, setShowInput] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<any>(null)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const filteredDogs = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return availableDogs
      .filter(dog => !value.some(selected => selected.dogId === dog.id))
      .filter(dog => {
        const displayName = dog.name
        const ownerName = dog.owner ? `${dog.owner.givenName} ${dog.owner.surname}` : ''
        return (
          displayName.toLowerCase().includes(term) ||
          ownerName.toLowerCase().includes(term) ||
          String(dog.trainingLevel).toLowerCase().includes(term)
        )
      })
      .sort((a, b) => {
        if (a.setCount !== b.setCount) {
          return a.setCount - b.setCount
        }
        return a.name.localeCompare(b.name)
      })
  }, [searchTerm, availableDogs, value])

  // Helper function to get validation error message for a specific dog
  const getValidationErrorForDog = useMemo(() => {
    const dogErrorMap = new Map<string, string>()

    if (!validationErrors || !currentSetId) return dogErrorMap

    const setValidationErrors = getValidationErrorsForSet ? getValidationErrorsForSet(currentSetId) : validationErrors

    setValidationErrors.forEach(error => {
      if (error.code === 'SAME_HANDLER_IN_SET' && error.extra?.conflicts) {
        error.extra.conflicts.forEach((conflict: any) => {
          if (conflict.setId === currentSetId && conflict.dogIds) {
            conflict.dogIds.forEach((dogId: string) => {
              dogErrorMap.set(dogId, `Multiple dogs from same handler (${conflict.handlerName})`)
            })
          }
        })
      }
      if (error.code === 'BACK_TO_BACK_HANDLERS' && error.extra?.backToBackHandlers) {
        error.extra.backToBackHandlers.forEach((handler: any) => {
          if (handler.dogIds) {
            handler.dogIds.forEach((dogId: string) => {
              dogErrorMap.set(dogId, `${handler.handlerName} is back to back in sets ${handler.setIndices.join(' ↔ ')}`)
            })
          }
        })
      }
    })

    return dogErrorMap
  }, [validationErrors, currentSetId, getValidationErrorsForSet])

  const handleSelect = (dog: DogWithSetCount) => {
    setIsSelecting(true)
    const newSetDog: Partial<SetDog> = {
      dogId: dog.id,
      index: value.length + 1
    }
    onChange([...value, newSetDog])
    setSearchTerm('')
    setTimeout(() => {
      inputRef.current?.focus()
      setIsSelecting(false)
      setShowDropdown(false)
      setTimeout(() => {
        setShowDropdown(true)
      }, 100)
    }, 0)
  }

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  const handleBlur = () => {
    if (isSelecting) return

    setTimeout(() => {
      if (!popoverRef.current?.contains(document.activeElement)) {
        setShowInput(false)
        setShowDropdown(false)
        setSearchTerm('')
      }
    }, 150)
  }

  useEffect(() => {
    if (showInput) {
      setShowDropdown(true)
      inputRef.current?.focus()
    }
  }, [showInput])

  useEffect(() => {
    if (showDropdown && filteredDogs.length > 0) {
      setHighlightedIndex(0)
    } else {
      setHighlightedIndex(-1)
    }
  }, [showDropdown, filteredDogs.length])

  useEffect(() => {
    if (showDropdown && filteredDogs.length === 0 && availableDogs.length > 0) {
      const timer = setTimeout(() => {
        setShowDropdown(false)
        setShowInput(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [showDropdown, filteredDogs.length, availableDogs.length])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSelecting) return

      if (showDropdown && popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowInput(false)
        setShowDropdown(false)
        setSearchTerm('')
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showDropdown, isSelecting])

  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx)
  }

  const handleDragOver = (idx: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === idx) return

    const newValue = [...value]
    const [removed] = newValue.splice(draggedIndex, 1)
    newValue.splice(idx, 0, removed)
    onChange(newValue)
    setDraggedIndex(idx)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const popover = (
    <Popover id="dogs-picker-autocomplete" ref={popoverRef} style={{ minWidth: '500px' }}>
      <Popover.Body tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
        <div className="d-flex flex-column" style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {filteredDogs.length === 0 ? (
            <div className="text-muted p-2">
              {availableDogs.length === 0 ? 'No dogs available' : 'All dogs have been added'}
            </div>
          ) : (
            filteredDogs.map((dog, idx) => {
              const displayName = dog.name
              const ownerName = dog.owner ? `${dog.owner.givenName} ${dog.owner.surname}` : ''
              return (
                <div
                  key={dog.id}
                  className={`p-2 hover-bg-light cursor-pointer${idx === highlightedIndex ? ` bg-primary ${isDark ? 'text-white' : ''}` : ''}`}
                  onMouseDown={() => handleSelect(dog)}
                  style={{ cursor: 'pointer' }}
                  tabIndex={0}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{displayName}</strong>
                      <span className={`ms-2 small ${idx === highlightedIndex ? `bg-primary ${isDark ? 'text-white' : ''}` : 'text-muted'}`}>{ownerName}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <TrainingLevelBadge level={dog.trainingLevel} />
                      <Badge
                        bg={dog.setCount < idealSetsPerDog ? 'success' : dog.setCount <= idealSetsPerDog ? 'warning' : 'danger'}
                        className="ms-2 small"
                      >
                        {dog.setCount} set{dog.setCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Popover.Body>
    </Popover>
  )

  return (
    <div>
      <div className="mb-2">
        {value.sort((a, b) => a.index - b.index).map((setDog, idx) => {
          const displayName = setDog.dog.name
          const { variant, className } = getTrainingLevelInfo(setDog.dog.trainingLevel)
          const hasValidationIssue = dogsWithValidationIssues?.has(setDog.dog.id)

          return (
            <div
              key={`${setDog.id}-${idx}`}
              className="mb-2"
              draggable={!disabled}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(idx, e)}
              onDragEnd={handleDragEnd}
              style={{ opacity: draggedIndex === idx ? 0.5 : 1, cursor: disabled ? 'default' : 'move' }}
            >
              <Badge bg={variant} className={`d-flex align-items-center justify-content-between w-100 ${className}`} style={{ minHeight: 38 }}>
                <span className={`me-2 d-inline-flex align-items-center ${isDark ? '' : 'text-dark'}`} style={{ cursor: disabled ? 'default' : 'grab' }}>
                  {!disabled && <GripVertical />}
                </span>
                <span className={`flex-grow-1 text-start d-flex align-items-center ${isDark ? '' : 'text-dark'}`}>
                  {hasValidationIssue && (
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id={`validation-error-${setDog.dog.id}`}>
                          {getValidationErrorForDog.get(setDog.dog.id) || 'This dog has validation issues'}
                        </Tooltip>
                      }
                    >
                      <ExclamationTriangle size={18} className="me-2 text-warning" title="This dog has validation issues" />
                    </OverlayTrigger>
                  )}
                  {displayName}
                </span>
                <span className="p-2 d-inline-flex align-items-center justify-content-center ms-auto" style={{ marginRight: '-8px', cursor: disabled ? 'default' : 'pointer' }} tabIndex={-1}>
                  <CloseButton
                    onClick={() => handleRemove(idx)}
                    className={isDark ? 'btn-close-white' : 'btn-close'}
                    aria-label={`Remove ${displayName}`}
                    disabled={disabled}
                  />
                </span>
              </Badge>
            </div>
          )
        })}
      </div>
      {showInput ? (
        <div style={{ position: 'relative' }}>
          <Form.Control
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            placeholder={placeholder}
            onFocus={() => setShowDropdown(true)}
            onBlur={handleBlur}
            onKeyDown={e => {
              if (!filteredDogs.length) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setShowDropdown(true)
                setHighlightedIndex(prev => (prev + 1) % filteredDogs.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setShowDropdown(true)
                setHighlightedIndex(prev => (prev - 1 + filteredDogs.length) % filteredDogs.length)
              } else if (e.key === 'Enter') {
                if (showDropdown && highlightedIndex >= 0 && highlightedIndex < filteredDogs.length) {
                  e.preventDefault()
                  handleSelect(filteredDogs[highlightedIndex])
                }
              } else if (e.key === 'Escape') {
                setShowDropdown(false)
              }
            }}
            autoFocus
            className="w-100"
            disabled={disabled}
          />
          <Overlay
            ref={overlayRef}
            target={inputRef.current}
            show={showDropdown}
            placement="top"
            rootClose={false}
            transition={false}
          >
            {popover}
          </Overlay>
        </div>
      ) : (
        <Button variant="outline-primary" onClick={() => setShowInput(true)} disabled={disabled}>
          + Add Dog
        </Button>
      )}
    </div>
  )
}
