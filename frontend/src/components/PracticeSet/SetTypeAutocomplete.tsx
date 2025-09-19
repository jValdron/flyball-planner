import { useState, useMemo, useEffect, useRef } from 'react'

import { Form, Dropdown, InputGroup, Button } from 'react-bootstrap'
import { ChevronDown } from 'react-bootstrap-icons'

import { SetType } from '../../graphql/generated/graphql'
import { getSetTypeDisplayName, findSetTypeByDisplayName, findSetTypeByPartialMatch } from '../../utils/setTypeUtils'

interface SetTypeAutocompleteProps {
  value: SetType | null
  typeCustom: string | null
  onChange: (type: SetType | null, typeCustom: string | null) => void
  disabled?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function SetTypeAutocomplete({ value, typeCustom, onChange, disabled = false, inputRef }: SetTypeAutocompleteProps) {
  const [show, setShow] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [inputValue, setInputValue] = useState(
    value === SetType.Custom && typeCustom ? typeCustom : (value ? getSetTypeDisplayName(value as SetType) : '')
  )
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const fallbackRef = useRef<HTMLInputElement>(null)
  const skipBlur = useRef(false)

  // Use provided ref or fallback to internal ref
  const actualInputRef = inputRef || fallbackRef

  useEffect(() => {
    setInputValue(value === SetType.Custom && typeCustom ? typeCustom : (value ? getSetTypeDisplayName(value as SetType) : ''))
  }, [value, typeCustom])

  const filteredTypes = useMemo(() => {
    const allTypes = Object.values(SetType).filter(type => type !== SetType.Custom)
    if (!searchTerm) return allTypes
    return findSetTypeByPartialMatch(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    if (show && filteredTypes.length > 0) {
      setHighlightedIndex(0)
    } else {
      setHighlightedIndex(-1)
    }
  }, [show, filteredTypes.length])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSearchTerm(newValue)
    setShow(true)
  }

  const handleInputFocus = () => {
    if (searchTerm) setShow(true)
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      if (skipBlur.current) {
        skipBlur.current = false
        return
      }
      setShow(false)
    }, 100)
    const newValue = inputValue.trim()

    if (newValue === '') {
      if (value !== null || typeCustom !== null) {
        onChange(null, null)
      }
      return
    }

    let newType: SetType
    let newTypeCustom: string | null
    const matchingType = findSetTypeByDisplayName(newValue)
    if (matchingType) {
      newType = matchingType
      newTypeCustom = null
    } else {
      newType = SetType.Custom
      newTypeCustom = newValue
    }
    if ((newType !== value && newType !== SetType.Custom) || newTypeCustom !== typeCustom) {
      onChange(newType, newTypeCustom)
    }
  }

  const handleSelect = (type: SetType) => {
    const displayName = getSetTypeDisplayName(type)
    setInputValue(displayName)
    setSearchTerm('')
    setShow(false)
    if (type !== value || typeCustom !== null) {
      onChange(type, null)
    }
    setTimeout(() => {
      actualInputRef?.current?.focus()
    }, 0)
  }

  const handleCaretMouseDown = () => {
    skipBlur.current = true
  }

  const handleCaretClick = (e: React.MouseEvent) => {
    e.preventDefault()
    actualInputRef?.current?.focus()
    setShow(true)
    setSearchTerm('')
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShow(true)
      setHighlightedIndex(0)
      return
    }
    if (!filteredTypes.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setShow(true)
      setHighlightedIndex(prev => (prev + 1) % filteredTypes.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setShow(true)
      setHighlightedIndex(prev => (prev - 1 + filteredTypes.length) % filteredTypes.length)
    } else if (e.key === 'Enter') {
      if (show && highlightedIndex >= 0 && highlightedIndex < filteredTypes.length) {
        e.preventDefault()
        handleSelect(filteredTypes[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setShow(false)
    }
  }

  const shouldShowDropdown = show && filteredTypes.length > 0 && (searchTerm.length > 0 || (document.activeElement === actualInputRef.current && show && searchTerm === ''))

  return (
    <Dropdown show={shouldShowDropdown} onToggle={setShow} className="set-type-autocomplete">
      <InputGroup>
        <Form.Control
          ref={actualInputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Set Type"
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          autoComplete="off"
          disabled={disabled}
        />
        <Button
          variant="outline-secondary"
          tabIndex={-1}
          onMouseDown={handleCaretMouseDown}
          onClick={handleCaretClick}
          style={{ borderLeft: 0 }}
          disabled={disabled}
        >
          <ChevronDown />
        </Button>
      </InputGroup>
      <Dropdown.Menu show={shouldShowDropdown} className="w-100">
        {filteredTypes.map((type, idx) => (
          <Dropdown.Item
            key={type}
            onMouseDown={() => handleSelect(type)}
            active={idx === highlightedIndex}
          >
            {getSetTypeDisplayName(type)}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
