import { Container, Table, Button, Badge, Alert, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { dogService } from '../services/dogService'
import type { Dog } from '../services/dogService'
import { ownerService } from '../services/ownerService'
import type { Owner } from '../services/ownerService'
import { useClub } from '../contexts/ClubContext'

// Helper function to get training level badge
const getTrainingLevelBadge = (level: number) => {
  const levels = {
    1: { text: 'Beginner', variant: 'secondary' },
    2: { text: 'Novice', variant: 'info' },
    3: { text: 'Intermediate', variant: 'primary' },
    4: { text: 'Advanced', variant: 'warning' },
    5: { text: 'Solid', variant: 'success' }
  }
  const { text, variant } = levels[level as keyof typeof levels]
  return <Badge bg={variant}>{text}</Badge>
}

function Dogs() {
  const navigate = useNavigate()
  const { selectedClubId } = useClub()
  const [dogs, setDogs] = useState<Dog[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedClubId) {
      loadDogs()
      loadOwners()
    } else {
      setLoading(false)
      setDogs([])
      setOwners([])
    }
  }, [selectedClubId])

  const loadOwners = async () => {
    try {
      const data = await ownerService.getOwners()
      setOwners(data)
    } catch (err) {
      console.error('Error loading owners:', err)
    }
  }

  const loadDogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dogService.getDogsByClub(selectedClubId)
      // Sort dogs by name
      const sortedDogs = [...(data || [])].sort((a, b) => a.Name.localeCompare(b.Name))
      setDogs(sortedDogs)
    } catch (err) {
      setError('Failed to load dogs. Please try again later.')
      console.error('Error loading dogs:', err)
      setDogs([])
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (dogId: string) => {
    navigate(`/dogs/${dogId}`)
  }

  const handleDelete = async (e: React.MouseEvent, dog: Dog) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this dog?')) {
      try {
        await ownerService.deleteDog(dog.OwnerID, dog.ID)
        setDogs(dogs.filter(d => d.ID !== dog.ID))
      } catch (err) {
        setError('Failed to delete dog. Please try again later.')
        console.error('Error deleting dog:', err)
      }
    }
  }

  const getOwnerName = (ownerId: string) => {
    const owner = owners.find(o => o.ID === ownerId)
    return owner ? `${owner.GivenName} ${owner.Surname}` : 'Unknown'
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (!selectedClubId) {
    return (
      <Container>
        <Alert variant="info" className="mt-4">
          Please select a club to view its dogs.
        </Alert>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Club Dogs</h1>
        <Button variant="primary" onClick={() => navigate('/dogs/new')}>Add New Dog</Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>CRN</th>
            <th>Owner</th>
            <th>Training Level</th>
            <th style={{ width: '1%' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dogs?.map((dog) => (
            <tr
              key={dog.ID}
              onClick={() => handleRowClick(dog.ID)}
              style={{ cursor: 'pointer' }}
              className="align-middle"
            >
              <td>{dog.Name}</td>
              <td className="font-monospace">{dog.CRN}</td>
              <td>{getOwnerName(dog.OwnerID)}</td>
              <td>{getTrainingLevelBadge(dog.TrainingLevel)}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={(e) => handleDelete(e, dog)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  )
}

export default Dogs
