import { Button, Dropdown } from 'react-bootstrap'
import { Trash, ChevronDown } from 'react-bootstrap-icons'

interface LocationSelectorProps {
  locations: Array<{ id: string; name: string; isDefault: boolean }>
  selectedLocationId: string
  onSelect: (locationId: string) => void
  onDelete: (locationId: string) => void
}

export function LocationSelector({ locations, selectedLocationId, onSelect, onDelete }: LocationSelectorProps) {
  const selectedLocation = locations.find(l => l.id === selectedLocationId)
  const otherLocations = locations.filter(l => l.id !== selectedLocationId)

  if (otherLocations.length === 0) return null

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-secondary" id="location-dropdown">
        {selectedLocation?.name}
        <ChevronDown className="ms-2" />
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {otherLocations.map(location => (
          <Dropdown.Item
            key={location.id}
            onClick={() => onSelect(location.id)}
            className="d-flex justify-content-between align-items-center"
          >
            {location.name}
            {!location.isDefault && (
              <Button
                variant="link"
                className="text-danger p-0 ms-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(location.id)
                }}
              >
                <Trash size={12} />
              </Button>
            )}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
