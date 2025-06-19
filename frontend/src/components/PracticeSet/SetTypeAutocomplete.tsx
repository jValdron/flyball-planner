import { useState, useMemo, useEffect, useRef } from 'react'
import { Form, Dropdown, InputGroup, Button } from 'react-bootstrap'
import { ChevronDown } from 'react-bootstrap-icons'
import { SetType } from '../../graphql/generated/graphql'

interface SetTypeAutocompleteProps {
  value: string | null
  typeCustom: string | null
  onChange: (type: SetType, typeCustom: string | null) => void
}

export function SetTypeAutocomplete({ value, typeCustom, onChange }: SetTypeAutocompleteProps) {
  const [show, setShow] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [inputValue, setInputValue] = useState(
    value === SetType.Custom && typeCustom ? typeCustom : (value || '')
  )
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const skipBlur = useRef(false)

  useEffect(() => {
    setInputValue(value === SetType.Custom && typeCustom ? typeCustom : (value || ''))
  }, [value, typeCustom])

  const filteredTypes = useMemo(() => {
    const allTypes = Object.values(SetType).filter(type => type !== SetType.Custom)
    if (!searchTerm) return allTypes
    const term = searchTerm.toLowerCase()
    return allTypes.filter(type =>
      type.toLowerCase().includes(term)
    )
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
    let newType: SetType
    let newTypeCustom: string | null
    const matchingType = Object.values(SetType).find(
      type => type.toLowerCase() === newValue.toLowerCase()
    )
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
    setInputValue(type)
    setSearchTerm('')
    setShow(false)
    if (type !== value || typeCustom !== null) {
      onChange(type, null)
    }
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleCaretMouseDown = () => {
    skipBlur.current = true
  }

  const handleCaretClick = (e: React.MouseEvent) => {
    e.preventDefault()
    inputRef.current?.focus()
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

  const shouldShowDropdown = show && (searchTerm.length > 0 || (document.activeElement === inputRef.current && show && searchTerm === ''))

  return (
    <Dropdown show={shouldShowDropdown} onToggle={setShow} style={{ width: '100%' }}>
      <InputGroup>
        <Form.Control
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Set Type"
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          autoComplete="off"
        />
        <Button
          variant="outline-secondary"
          tabIndex={-1}
          onMouseDown={handleCaretMouseDown}
          onClick={handleCaretClick}
          style={{ borderLeft: 0 }}
        >
          <ChevronDown />
        </Button>
      </InputGroup>
      <Dropdown.Menu show={shouldShowDropdown} className="w-100">
        {filteredTypes.length === 0 ? (
          <Dropdown.Item disabled>No existing types found</Dropdown.Item>
        ) : (
          filteredTypes.map((type, idx) => (
            <Dropdown.Item
              key={type}
              onMouseDown={() => handleSelect(type)}
              active={idx === highlightedIndex}
            >
              {type}
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}
