import React from 'react'
import { Container, Table, Button, Badge, Alert, Spinner, Form, InputGroup } from 'react-bootstrap'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { dogService } from '../services/dogService'
import type { Dog, DogStatus } from '../services/dogService'
import { ownerService } from '../services/ownerService'
import type { Owner } from '../services/ownerService'
import { useClub } from '../contexts/ClubContext'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { PlusLg, Trash, PersonPlus } from 'react-bootstrap-icons'

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

const getStatusBadge = (status: string) => {
  const variants = {
    Active: { text: 'Active', variant: 'success' },
    Inactive: { text: 'Inactive', variant: 'secondary' }
  }
  const { text, variant } = variants[status as keyof typeof variants]
  return <Badge bg={variant}>{text}</Badge>
}

function Dogs() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedClub } = useClub()
  const [dogs, setDogs] = useState<Dog[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [dogToDelete, setDogToDelete] = useState<Dog | null>(null)
  const [showInactive, setShowInactive] = useState(searchParams.get('showInactive') === 'true')
  const [searchQuery, setSearchQuery] = useState('')

  const handleShowInactiveChange = (checked: boolean) => {
    setShowInactive(checked)
    setSearchParams(prev => {
      if (checked) {
        prev.set('showInactive', 'true')
      } else {
        prev.delete('showInactive')
      }
      return prev
    })
  }

  useEffect(() => {
    if (selectedClub) {
      loadDogs()
      loadOwners()
    } else {
      setLoading(false)
      setDogs([])
      setOwners([])
    }
  }, [selectedClub])

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
      if (!selectedClub) return
      const data = await dogService.getDogsByClub(selectedClub.ID)
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
    setDogToDelete(dog)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!dogToDelete) return
    try {
      await dogService.deleteDog(dogToDelete.OwnerID, dogToDelete.ID)
      setDogs(dogs.filter(d => d.ID !== dogToDelete.ID))
    } catch (err) {
      setError('Failed to delete dog. Please try again later.')
      console.error('Error deleting dog:', err)
    } finally {
      setShowDeleteModal(false)
      setDogToDelete(null)
    }
  }

  const getOwnerName = (owner: Owner | undefined) => {
    return owner ? `${owner.GivenName} ${owner.Surname}` : 'Unknown'
  }

  const getDogsByOwner = () => {
    const dogsByOwner = new Map<string, Dog[]>()
    dogs.forEach(dog => {
      const ownerDogs = dogsByOwner.get(dog.OwnerID) || []
      ownerDogs.push(dog)
      dogsByOwner.set(dog.OwnerID, ownerDogs)
    })

    const filteredAndSorted = Array.from(dogsByOwner.entries())
      .filter(([ownerId, ownerDogs]) => {
        const owner = owners.find(o => o.ID === ownerId)
        const ownerName = getOwnerName(owner).toLowerCase()
        const searchLower = searchQuery.toLowerCase()

        const ownerMatches = ownerName.includes(searchLower)

        if (ownerMatches) {
          return true
        }

        const hasMatchingDogs = ownerDogs.some(dog => {
          const matchesInactive = showInactive || dog.Status === 'Active'
          const matchesSearch = searchQuery === '' ||
            dog.Name.toLowerCase().includes(searchLower) ||
            (dog.CRN?.toLowerCase() || '').includes(searchLower)
          return matchesInactive && matchesSearch
        })

        return hasMatchingDogs
      })
      .map(([ownerId, ownerDogs]) => {
        const owner = owners.find(o => o.ID === ownerId)
        const ownerName = getOwnerName(owner).toLowerCase()
        const searchLower = searchQuery.toLowerCase()
        const ownerMatches = ownerName.includes(searchLower)

        if (ownerMatches) {
          const filteredDogs = ownerDogs.filter(dog => showInactive || dog.Status === 'Active')
          return [ownerId, filteredDogs] as const
        }

        const filteredDogs = ownerDogs.filter(dog => {
          const matchesInactive = showInactive || dog.Status === 'Active'
          const matchesSearch = searchQuery === '' ||
            dog.Name.toLowerCase().includes(searchLower) ||
            (dog.CRN?.toLowerCase() || '').includes(searchLower)
          return matchesInactive && matchesSearch
        })
        return [ownerId, filteredDogs] as const
      })
      .filter(([_, dogs]) => dogs.length > 0)
      .sort(([ownerIdA], [ownerIdB]) => {
        const ownerA = owners.find(o => o.ID === ownerIdA)
        const ownerB = owners.find(o => o.ID === ownerIdB)
        const nameA = ownerA ? `${ownerA.GivenName} ${ownerA.Surname}` : ''
        const nameB = ownerB ? `${ownerB.GivenName} ${ownerB.Surname}` : ''
        return nameA.localeCompare(nameB)
      })
      .map(([ownerId, ownerDogs]) => {
        return [ownerId, ownerDogs.sort((a, b) => a.Name.localeCompare(b.Name))] as const
      })

    return new Map(filteredAndSorted)
  }

  const handleStatusChange = async (dog: Dog, newStatus: DogStatus) => {
    try {
      const updatedDog = await dogService.updateDog(dog.OwnerID, dog.ID, {
        Status: newStatus
      })
      setDogs(prev => prev.map(d => d.ID === dog.ID ? updatedDog : d))
    } catch (err) {
      setError('Failed to update dog status')
      console.error(err)
    }
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

  if (!selectedClub) {
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
        <h1>Owners & Dogs</h1>
        <div>
          <Button variant="primary" className="me-2" onClick={() => navigate('/owners/new')}>
            <PersonPlus className="me-2" />
            New Owner
          </Button>
          <Button variant="success" onClick={() => navigate('/dogs/new')}>
            <PlusLg className="me-2" />
            New Dog
          </Button>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3 mb-3">
        <InputGroup style={{ maxWidth: '300px' }}>
          <Form.Control
            type="text"
            placeholder="Search owners or dogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <Form.Check
          type="checkbox"
          id="show-inactive"
          label="Show inactive dogs"
          checked={showInactive}
          onChange={(e) => handleShowInactiveChange(e.target.checked)}
        />
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th className="col-6 col-md-4">Name</th>
            <th className="col-3 col-md-2">CRN</th>
            <th className="d-none d-md-table-cell col-md-2">Status</th>
            <th className="col-2 col-md-2">Training Level</th>
            <th className="col-1 text-end">
              <span className="d-none d-md-inline">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from(getDogsByOwner()).length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted py-4">
                No matching owners or dogs found
              </td>
            </tr>
          ) : (
            Array.from(getDogsByOwner()).map(([ownerId, ownerDogs]) => {
              const owner = owners.find(o => o.ID === ownerId)
              const ownerName = getOwnerName(owner)
              const sortedDogs = [...ownerDogs].sort((a, b) => a.Name.localeCompare(b.Name))

              return (
                <React.Fragment key={ownerId}>
                  <tr
                    className="table-secondary"
                    onClick={() => navigate(`/owners/${ownerId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td colSpan={5}>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>{ownerName}</strong>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/dogs/new?ownerId=${ownerId}`)
                          }}
                        >
                          <PlusLg className="me-1" />
                          New Dog
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {sortedDogs.map((dog) => (
                    <tr
                      key={dog.ID}
                      onClick={() => handleRowClick(dog.ID)}
                      style={{ cursor: 'pointer' }}
                      className={`align-middle`}
                    >
                      <td className={`ps-4 ${dog.Status === 'Inactive' ? 'text-muted' : ''} col-6 col-md-4`}>{dog.Name}</td>
                      <td className="font-monospace col-3 col-md-2">{dog.CRN}</td>
                      <td className="d-none d-md-table-cell col-md-2">{getStatusBadge(dog.Status)}</td>
                      <td className="col-2 col-md-2">{getTrainingLevelBadge(dog.TrainingLevel)}</td>
                      <td className="col-1" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={(e) => handleDelete(e, dog)}
                        >
                          <Trash className="me-md-1" />
                          <span className="d-none d-md-inline">Delete</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )
            })
          )}
        </tbody>
      </Table>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false)
          setDogToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirm Dog Deletion"
        message="Are you sure you want to delete this dog?"
        confirmButtonText="Delete Dog"
      />
    </Container>
  )
}

export default Dogs
