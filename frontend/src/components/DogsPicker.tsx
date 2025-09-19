import { useState, useMemo, useRef, useEffect } from 'react'

import { Form, Badge, Overlay, Popover, Button, CloseButton, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { GripVertical, ExclamationTriangle, ClockHistory, QuestionCircle } from 'react-bootstrap-icons'
import { useDroppable, useDndMonitor } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { Dog, SetDog } from '../graphql/generated/graphql'
import { AttendanceStatus } from '../graphql/generated/graphql'
import type { ValidationError } from '../services/practiceValidation'
import { getTrainingLevelInfo } from '../utils/trainingLevels'
import { useTheme } from '../contexts/ThemeContext'
import { useClub } from '../contexts/ClubContext'
import TrainingLevelBadge from './TrainingLevelBadge'

interface DogWithSetCount extends Dog {
  setCount: number
  attendanceStatus?: AttendanceStatus
}

interface DogsPickerProps {
  value: SetDog[]
  onChange: (dogs: Partial<SetDog>[]) => void
  availableDogs: DogWithSetCount[]
  placeholder?: string
  disabled?: boolean
  isLocked?: boolean
  dogsWithValidationIssues?: Set<string>
  validationErrors?: ValidationError[]
  getValidationErrorsForSet?: (setId: string) => ValidationError[]
  currentSetId?: string
  pickerId: string
  isDragOver?: boolean
}

interface SortableDogItemProps {
  setDog: SetDog
  index: number
  disabled: boolean
  isLocked: boolean
  dogsWithValidationIssues?: Set<string>
  getValidationErrorsForDog: Map<string, string[]>
  getValidationSeverityForDog: Map<string, 'warning' | 'info'>
  onRemove: (index: number) => void
  isDark: boolean
  pickerId: string
}

function SortableDogItem({
  setDog,
  index,
  disabled,
  isLocked,
  dogsWithValidationIssues,
  getValidationErrorsForDog,
  getValidationSeverityForDog,
  onRemove,
  isDark,
  pickerId
}: SortableDogItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${setDog.id}-${index}`,
    disabled: disabled || isLocked,
    data: {
      setDog,
      pickerId,
      type: 'dog'
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const displayName = setDog.dog.name
  const { variant } = getTrainingLevelInfo(setDog.dog.trainingLevel)
  const hasValidationIssue = dogsWithValidationIssues?.has(setDog.dog.id)
  const validationSeverity = getValidationSeverityForDog.get(setDog.dog.id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2 w-100"
      {...attributes}
    >
      <Badge bg={variant} className={`d-flex align-items-center justify-content-between w-100`} style={{ minHeight: 38, cursor: disabled ? 'default' : 'grab' }} {...listeners}>
        <span className={`me-2 d-inline-flex align-items-center ${isDark ? '' : 'text-dark'}`}>
          {!disabled && <GripVertical />}
        </span>
        <span className={`flex-grow-1 text-start d-flex align-items-center ${isDark ? '' : 'text-dark'}`}>
          {hasValidationIssue && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id={`validation-error-${setDog.dog.id}`}>
                  <div>
                    {getValidationErrorsForDog.get(setDog.dog.id)?.map((error, index) => (
                      <div key={index} className="mb-1">
                        • {error}
                      </div>
                    )) || 'This dog has validation issues'}
                  </div>
                </Tooltip>
              }
            >
              {validationSeverity === 'info' ? (
                <ClockHistory size={18} className="me-2 text-info" title="This dog has validation issues" />
              ) : (
                <ExclamationTriangle size={18} className="me-2 text-warning" title="This dog has validation issues" />
              )}
            </OverlayTrigger>
          )}
          {displayName}
        </span>
        {!isLocked && (
          <span className={`p-2 d-inline-flex align-items-center justify-content-center ms-auto ${disabled ? '' : 'cur-point'}`} style={{ marginRight: '-8px' }} tabIndex={-1}>
            <CloseButton
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onRemove(index)
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onPointerDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onTouchStart={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className={isDark ? 'btn-close-white' : 'btn-close'}
              aria-label={`Remove ${displayName}`}
              disabled={disabled}
            />
          </span>
        )}
      </Badge>
    </div>
  )
}

export function DogsPicker({
  value,
  onChange,
  availableDogs,
  placeholder = 'Add dog...',
  disabled = false,
  isLocked = false,
  dogsWithValidationIssues,
  validationErrors,
  getValidationErrorsForSet,
  currentSetId,
  pickerId,
  isDragOver = false
}: DogsPickerProps) {
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
  const [isSelecting, setIsSelecting] = useState(false)
  const [isDraggingFromThisPicker, setIsDraggingFromThisPicker] = useState(false)

  // Drop zone for cross-picker drag and drop
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `picker-${pickerId}`,
    data: {
      pickerId,
      type: 'picker'
    }
  })

  // Monitor drag events to show visual feedback when dragging from this picker
  useDndMonitor({
    onDragStart: (event) => {
      if (event.active.data.current?.pickerId === pickerId) {
        setIsDraggingFromThisPicker(true)
      }
    },
    onDragEnd: () => {
      setIsDraggingFromThisPicker(false)
    }
  })

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
        const aIsUnconfirmed = a.attendanceStatus === AttendanceStatus.Unknown
        const bIsUnconfirmed = b.attendanceStatus === AttendanceStatus.Unknown

        if (aIsUnconfirmed !== bIsUnconfirmed) {
          return aIsUnconfirmed ? 1 : -1
        }

        if (a.setCount !== b.setCount) {
          return a.setCount - b.setCount
        }

        return a.name.localeCompare(b.name)
      })
  }, [searchTerm, availableDogs, value])

  // Helper function to get all validation errors for a specific dog
  const getValidationErrorsForDog = useMemo(() => {
    const dogErrorsMap = new Map<string, Set<string>>()

    if (!validationErrors || !currentSetId) return new Map<string, string[]>()

    const setValidationErrors = getValidationErrorsForSet ? getValidationErrorsForSet(currentSetId) : []

    // Check both set-specific errors and practice-level errors
    const allErrors = [...setValidationErrors, ...validationErrors]

    allErrors.forEach(error => {
      if (error.code === 'SAME_HANDLER_IN_SET' && error.extra?.conflicts) {
        error.extra.conflicts.forEach((conflict: any) => {
          if (conflict.setId === currentSetId && conflict.dogIds) {
            conflict.dogIds.forEach((dogId: string) => {
              if (!dogErrorsMap.has(dogId)) {
                dogErrorsMap.set(dogId, new Set())
              }
              dogErrorsMap.get(dogId)!.add(`Multiple dogs from same handler (${conflict.handlerName})`)
            })
          }
        })
      }
      if (error.code === 'BACK_TO_BACK_HANDLERS' && error.extra?.backToBackHandlers) {
        error.extra.backToBackHandlers.forEach((handler: any) => {
          if (handler.dogIds && handler.setIndices && handler.setIds) {
            if (currentSetId && handler.setIds.includes(currentSetId)) {
              handler.dogIds.forEach((dogId: string) => {
                if (!dogErrorsMap.has(dogId)) {
                  dogErrorsMap.set(dogId, new Set())
                }
                dogErrorsMap.get(dogId)!.add(`${handler.handlerName} is back to back in sets ${handler.setIndices.join(' ↔ ')}`)
              })
            }
          }
        })
      }
      if (error.code === 'INSUFFICIENT_DOG_REST' && error.extra?.insufficientRest) {
        error.extra.insufficientRest.forEach((dogInfo: any) => {
          const gapDetails = dogInfo.setGaps.map((gap: any) => `sets ${gap.from}→${gap.to} (${gap.gap} sets apart)`).join(', ')
          if (!dogErrorsMap.has(dogInfo.dog.id)) {
            dogErrorsMap.set(dogInfo.dog.id, new Set())
          }
          dogErrorsMap.get(dogInfo.dog.id)!.add(`Insufficient rest: ${gapDetails}`)
        })
      }
      if (error.code === 'SUBOPTIMAL_DOG_REST' && error.extra?.suboptimalRest) {
        error.extra.suboptimalRest.forEach((dogInfo: any) => {
          const gapDetails = dogInfo.setGaps.map((gap: any) => `sets ${gap.from}→${gap.to} (${gap.gap} sets apart)`).join(', ')
          if (!dogErrorsMap.has(dogInfo.dog.id)) {
            dogErrorsMap.set(dogInfo.dog.id, new Set())
          }
          dogErrorsMap.get(dogInfo.dog.id)!.add(`Suboptimal rest: ${gapDetails}`)
        })
      }
    })

    const result = new Map<string, string[]>()
    dogErrorsMap.forEach((errorSet, dogId) => {
      result.set(dogId, Array.from(errorSet))
    })

    return result
  }, [validationErrors, currentSetId, getValidationErrorsForSet])

  // Helper function to get validation severity for a specific dog
  const getValidationSeverityForDog = useMemo(() => {
    const dogSeverityMap = new Map<string, 'warning' | 'info'>()

    if (!validationErrors || !currentSetId) return dogSeverityMap

    const setValidationErrors = getValidationErrorsForSet ? getValidationErrorsForSet(currentSetId) : []
    const allErrors = [...setValidationErrors, ...validationErrors]

    allErrors.forEach(error => {
      if (error.code === 'SAME_HANDLER_IN_SET' && error.extra?.conflicts) {
        error.extra.conflicts.forEach((conflict: any) => {
          if (conflict.setId === currentSetId && conflict.dogIds) {
            conflict.dogIds.forEach((dogId: string) => {
              dogSeverityMap.set(dogId, 'warning')
            })
          }
        })
      }
      if (error.code === 'BACK_TO_BACK_HANDLERS' && error.extra?.backToBackHandlers) {
        error.extra.backToBackHandlers.forEach((handler: any) => {
          if (handler.dogIds && handler.setIndices && handler.setIds) {
            if (currentSetId && handler.setIds.includes(currentSetId)) {
              handler.dogIds.forEach((dogId: string) => {
                dogSeverityMap.set(dogId, 'warning')
              })
            }
          }
        })
      }
      if (error.code === 'INSUFFICIENT_DOG_REST' && error.extra?.insufficientRest) {
        error.extra.insufficientRest.forEach((dogInfo: any) => {
          dogSeverityMap.set(dogInfo.dog.id, 'warning')
        })
      }
      if (error.code === 'SUBOPTIMAL_DOG_REST' && error.extra?.suboptimalRest) {
        error.extra.suboptimalRest.forEach((dogInfo: any) => {
          // Only set to info if there's no other validation issue for this dog
          if (!dogSeverityMap.has(dogInfo.dog.id)) {
            dogSeverityMap.set(dogInfo.dog.id, 'info')
          }
        })
      }
    })

    return dogSeverityMap
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




  const popover = (
    <Popover id="dogs-picker-autocomplete" ref={popoverRef} style={{ minWidth: '500px' }}>
      <Popover.Body tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
        <div className="d-flex flex-column" style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {filteredDogs.length === 0 ? (
            <div className="text-muted p-2">
              {availableDogs.length === 0
                ? 'No dogs available'
                : searchTerm.trim() === ''
                  ? 'All dogs have been added'
                  : 'No dogs match your search'
              }
            </div>
          ) : (
            filteredDogs.map((dog, idx) => {
              const displayName = dog.name
              const ownerName = dog.owner ? `${dog.owner.givenName} ${dog.owner.surname}` : ''
              return (
                <div
                  key={dog.id}
                  className={`p-2 hover-bg-light cur-point${idx === highlightedIndex ? ` bg-primary ${isDark ? 'text-white' : ''}` : ''}`}
                  onMouseDown={() => handleSelect(dog)}
                  tabIndex={0}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      {dog.attendanceStatus === AttendanceStatus.Unknown && (
                        <QuestionCircle
                          size={16}
                          className={`me-2 ${idx === highlightedIndex ? (isDark ? 'text-white' : 'text-primary') : 'text-warning'}`}
                          title="Attendance not confirmed"
                        />
                      )}
                      <div>
                        <strong>{displayName}</strong>
                        <span className={`ms-2 small ${idx === highlightedIndex ? `bg-primary ${isDark ? 'text-white' : ''}` : 'text-muted'}`}>{ownerName}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <TrainingLevelBadge level={dog.trainingLevel} />
                      <Badge
                        bg={dog.setCount < idealSetsPerDog ? 'primary' : dog.setCount <= idealSetsPerDog ? 'success' : 'danger'}
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


  const shouldShowVisualFeedback = isDragOver || isOver || isDraggingFromThisPicker
  const isDragOverTarget = isDragOver || isOver
  const isDragFromSource = isDraggingFromThisPicker && !isDragOverTarget

  return (
    <div
      ref={setDropRef}
      className={`dogs-picker-container ${
        shouldShowVisualFeedback ? 'dogs-picker-container--with-feedback' : ''
      } ${
        isDragOverTarget ? 'dogs-picker-container--drag-target' : ''
      } ${
        isDragFromSource ? 'dogs-picker-container--drag-source' : ''
      }`}
    >
      <SortableContext
        items={value.sort((a, b) => a.index - b.index).map((setDog, idx) => `${setDog.id}-${idx}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mb-2">
          {value.sort((a, b) => a.index - b.index).map((setDog, idx) => (
            <SortableDogItem
              key={`${setDog.id}-${idx}`}
              setDog={setDog}
              index={idx}
              disabled={disabled}
              isLocked={isLocked}
              dogsWithValidationIssues={dogsWithValidationIssues}
              getValidationErrorsForDog={getValidationErrorsForDog}
              getValidationSeverityForDog={getValidationSeverityForDog}
              onRemove={handleRemove}
              isDark={isDark}
              pickerId={pickerId}
            />
          ))}
        </div>
      </SortableContext>
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
      ) : !isLocked ? (
        <Button
          variant="outline-primary"
          onClick={() => setShowInput(true)}
          disabled={disabled}
        >
          + Add Dog
        </Button>
      ) : null}
    </div>
  )
}
