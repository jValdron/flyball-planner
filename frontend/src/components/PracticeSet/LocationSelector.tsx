import { Button, Dropdown, InputGroup } from 'react-bootstrap'
import { PlusLg } from 'react-bootstrap-icons'

interface LocationSelectorProps {
  availableLocations: Array<{ id: string; name: string; isDefault: boolean }>
  onSelect: (locationId: string) => void
  disabled?: boolean
}

export function LocationSelector({ availableLocations, onSelect, disabled = false }: LocationSelectorProps) {
  const sortedLocations = [...availableLocations].sort((a, b) => a.name.localeCompare(b.name))
  const nextLocation = sortedLocations[0]

  if (availableLocations.length === 0) return null

  // If only one location, show just the button without dropdown
  if (availableLocations.length === 1) {
    return (
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => onSelect(nextLocation.id)}
        className="text-nowrap d-flex align-items-center"
        disabled={disabled}
      >
        <PlusLg className="me-2" />
        {nextLocation.name}
      </Button>
    )
  }

  // Multiple locations - show button with dropdown
  return (
    <InputGroup size="sm">
      <Button
        variant="outline-secondary"
        onClick={() => onSelect(nextLocation.id)}
        className="text-nowrap d-flex align-items-center"
        disabled={disabled}
      >
        <PlusLg className="me-2" />
        {nextLocation.name}
      </Button>
      <Dropdown>
        <Dropdown.Toggle variant="outline-secondary" disabled={disabled} />
        <Dropdown.Menu>
          {sortedLocations.map(location => (
            <Dropdown.Item
              key={location.id}
              onClick={() => onSelect(location.id)}
            >
              {location.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </InputGroup>
  )
}
