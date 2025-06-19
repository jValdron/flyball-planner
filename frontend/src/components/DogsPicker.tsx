import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Form, Badge, OverlayTrigger, Popover, Button, CloseButton } from 'react-bootstrap'
import { GripVertical } from 'react-bootstrap-icons'
import TrainingLevelBadge from './TrainingLevelBadge'
import { getTrainingLevelInfo } from '../utils/trainingLevels'
import type { Dog, SetDog } from '../graphql/generated/graphql'

interface DogWithSetCount extends Dog {
  setCount: number
}

interface DogsPickerProps {
  value: SetDog[]
  onChange: (dogs: Partial<SetDog>[]) => void
  availableDogs: DogWithSetCount[]
  placeholder?: string
}

export function DogsPicker({ value, onChange, availableDogs, placeholder = 'Add dog...' }: DogsPickerProps) {
  const [showInput, setShowInput] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

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

  const handleSelect = (dog: DogWithSetCount) => {
    const newSetDog: Partial<SetDog> = {
      dogId: dog.id,
      index: value.length + 1
    }
    onChange([...value, newSetDog])
    setSearchTerm('')
    setShowDropdown(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      if (!popoverRef.current?.contains(document.activeElement)) {
        setShowInput(false)
        setShowDropdown(false)
        setSearchTerm('')
      }
    }, 100)
  }

  const handlePopoverBlur = () => {
    setShowInput(false)
    setShowDropdown(false)
    setSearchTerm('')
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

  // Drag and drop handlers
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
      <Popover.Body tabIndex={-1} onBlur={handlePopoverBlur}>
        <div className="d-flex flex-column" style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {filteredDogs.length === 0 ? (
            <div className="text-muted">No dogs found</div>
          ) : (
            filteredDogs.map((dog, idx) => {
              const displayName = dog.name
              const ownerName = dog.owner ? `${dog.owner.givenName} ${dog.owner.surname}` : ''
              return (
                <div
                  key={dog.id}
                  className={`p-2 hover-bg-light cursor-pointer${idx === highlightedIndex ? ' bg-primary text-white' : ''}`}
                  onClick={() => handleSelect(dog)}
                  style={{ cursor: 'pointer' }}
                  tabIndex={0}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{displayName}</strong>
                      <span className={`ms-2 small ${idx === highlightedIndex ? 'bg-primary text-white' : 'text-muted'}`}>{ownerName}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <TrainingLevelBadge level={dog.trainingLevel} />
                      <Badge
                        bg={dog.setCount < 2 ? 'success' : dog.setCount <= 2 ? 'warning' : 'danger'}
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
          const { variant } = getTrainingLevelInfo(setDog.dog.trainingLevel)
          return (
            <div
              key={`${setDog.id}-${idx}`}
              className="mb-2"
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(idx, e)}
              onDragEnd={handleDragEnd}
              style={{ opacity: draggedIndex === idx ? 0.5 : 1, cursor: 'move' }}
            >
              <Badge bg={variant} className="d-flex align-items-center justify-content-between w-100" style={{ minHeight: 38 }}>
                <span className="me-2 d-inline-flex align-items-center" style={{ cursor: 'grab' }}>
                  <GripVertical />
                </span>
                <span className="flex-grow-1 text-start">{displayName}</span>
                <span className="p-2 d-inline-flex align-items-center justify-content-center ms-auto" style={{ marginRight: '-8px', cursor: 'pointer' }} tabIndex={-1}>
                  <CloseButton
                    onClick={() => handleRemove(idx)}
                    className="btn-close-white"
                    aria-label={`Remove ${displayName}`}
                  />
                </span>
              </Badge>
            </div>
          )
        })}
      </div>
      {showInput ? (
        <OverlayTrigger
          show={showDropdown}
          placement="bottom"
          overlay={popover}
          trigger="click"
          rootClose={false}
        >
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
          />
        </OverlayTrigger>
      ) : (
        <Button variant="outline-primary" onClick={() => setShowInput(true)}>
          + Add Dog
        </Button>
      )}
    </div>
  )
}
