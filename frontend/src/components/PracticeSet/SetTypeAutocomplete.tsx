import { useState, useMemo } from 'react'
import { Form, OverlayTrigger, Popover } from 'react-bootstrap'
import { SetType } from '../../graphql/generated/graphql'

interface SetTypeAutocompleteProps {
  value: string
  typeCustom: string | null
  onChange: (type: SetType, typeCustom: string | null) => void
}

export function SetTypeAutocomplete({ value, typeCustom, onChange }: SetTypeAutocompleteProps) {
  const [show, setShow] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTypes = useMemo(() => {
    if (!searchTerm) return []
    const term = searchTerm.toLowerCase()
    return Object.values(SetType).filter(type =>
      type.toLowerCase().includes(term)
    )
  }, [searchTerm])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setShow(true)

    const matchingType = Object.values(SetType).find(
      type => type.toLowerCase() === newValue.toLowerCase()
    )
    if (matchingType) {
      onChange(matchingType, null)
    } else {
      onChange(SetType.Custom, newValue)
    }
  }

  const handleSelect = (type: SetType) => {
    onChange(type, null)
    setShow(false)
    setSearchTerm('')
  }

  const popover = (
    <Popover id="set-type-autocomplete" style={{ width: '300px' }}>
      <Popover.Body>
        <div className="d-flex flex-column" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filteredTypes.length === 0 ? (
            <div className="text-muted">No types found</div>
          ) : (
            filteredTypes.map(type => (
              <div
                key={type}
                className="p-2 hover-bg-light cursor-pointer"
                onClick={() => handleSelect(type)}
                style={{ cursor: 'pointer' }}
              >
                {type}
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
        placeholder="Set Type"
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
      />
    </OverlayTrigger>
  )
}
