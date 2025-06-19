import { Button, Dropdown, InputGroup } from 'react-bootstrap'
import { PlusLg } from 'react-bootstrap-icons'

interface LocationSelectorProps {
  availableLocations: Array<{ id: string; name: string; isDefault: boolean }>
  onSelect: (locationId: string) => void
}

export function LocationSelector({ availableLocations, onSelect }: LocationSelectorProps) {
  const sortedLocations = [...availableLocations].sort((a, b) => a.name.localeCompare(b.name))
  const nextLocation = sortedLocations[0]

  if (availableLocations.length === 0) return null

  return (
    <InputGroup size="sm">
      <Button
        variant="outline-secondary"
        onClick={() => onSelect(nextLocation.id)}
        className="text-start"
      >
        <PlusLg className="me-2" />
        {nextLocation.name}
      </Button>
      <Dropdown>
        <Dropdown.Toggle variant="outline-secondary" />
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
