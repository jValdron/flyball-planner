import { useState, useMemo } from 'react'
import { Form, Badge, OverlayTrigger, Popover } from 'react-bootstrap'

interface DogAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (dog: { id: string; name: string; displayName: string }) => void
  attendingDogsList: Array<{ id: string; name: string; displayName: string }>
  placeholder: string
}

export function DogAutocomplete({ value, onChange, onSelect, attendingDogsList, placeholder }: DogAutocompleteProps) {
  const [show, setShow] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDogs = useMemo(() => {
    if (!searchTerm) return []
    const term = searchTerm.toLowerCase()
    return attendingDogsList.filter(dog =>
      dog.displayName.toLowerCase().includes(term)
    )
  }, [searchTerm, attendingDogsList])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSearchTerm(newValue)
    setShow(true)
  }

  const handleSelect = (dog: { id: string; name: string; displayName: string }) => {
    onSelect(dog)
    setShow(false)
    setSearchTerm('')
  }

  const popover = (
    <Popover id="dog-autocomplete" style={{ width: '300px' }}>
      <Popover.Body>
        <div className="d-flex flex-column" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filteredDogs.length === 0 ? (
            <div className="text-muted">No dogs found</div>
          ) : (
            filteredDogs.map(dog => (
              <div
                key={dog.id}
                className="p-2 hover-bg-light cursor-pointer"
                onClick={() => handleSelect(dog)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span>{dog.displayName}</span>
                  <Badge bg="secondary">Level {dog.trainingLevel}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Popover.Body>
    </Popover>
  )

  return (
    <OverlayTrigger
      show={show && searchTerm.length > 0}
      placement="bottom"
      overlay={popover}
      trigger="click"
    >
      <Form.Control
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
      />
    </OverlayTrigger>
  )
}
