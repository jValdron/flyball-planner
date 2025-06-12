import React from 'react'
import { Container, Table, Button, Badge, Alert, Spinner, Form, InputGroup } from 'react-bootstrap'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useClub } from '../contexts/ClubContext'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { PlusLg, Trash, PersonPlus } from 'react-bootstrap-icons'
import { GetDogsByHandlersInClub, DeleteDog } from '../graphql/dogs'
import type { DogStatus } from '../graphql/generated/graphql'
import type { DocumentType } from '../graphql/generated/gql'

type HandlerWithDogs = NonNullable<DocumentType<typeof GetDogsByHandlersInClub>['dogsByHandlersInClub']>[number]
type DogWithBasicInfo = NonNullable<HandlerWithDogs['dogs']>[number]

const getTrainingLevelBadge = (level: number) => {
  const levels = {
    1: { text: 'Beginner', variant: 'secondary' },
    2: { text: 'Novice', variant: 'info' },
    3: { text: 'Intermediate', variant: 'primary' },
    4: { text: 'Advanced', variant: 'warning text-dark' },
    5: { text: 'Solid', variant: 'primary' }
  }
  const { text, variant } = levels[level as keyof typeof levels]
  return <Badge bg={variant}>{text}</Badge>
}

const getStatusBadge = (status: DogStatus) => {
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
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [dogToDelete, setDogToDelete] = useState<DogWithBasicInfo | null>(null)
  const [showInactive, setShowInactive] = useState(searchParams.get('showInactive') === 'true')
  const [searchQuery, setSearchQuery] = useState('')

  const { loading, data } = useQuery<DocumentType<typeof GetDogsByHandlersInClub>>(GetDogsByHandlersInClub, {
    variables: { clubId: selectedClub?.id },
    skip: !selectedClub,
    onError: (err) => {
      setError('Failed to load dogs. Please try again later.')
      console.error('Error loading dogs:', err)
    }
  })

  const [deleteDog] = useMutation(DeleteDog, {
    refetchQueries: [{ query: GetDogsByHandlersInClub, variables: { clubId: selectedClub?.id } }]
  })

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

  const handleRowClick = (dogId: string) => {
    navigate(`/dogs/${dogId}`)
  }

  const handleDelete = async (e: React.MouseEvent, dog: DogWithBasicInfo) => {
    e.stopPropagation()
    setDogToDelete(dog)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!dogToDelete) return
    try {
      await deleteDog({ variables: { id: dogToDelete.id } })
    } catch (err) {
      setError('Failed to delete dog. Please try again later.')
      console.error('Error deleting dog:', err)
    } finally {
      setShowDeleteModal(false)
      setDogToDelete(null)
    }
  }

  const getHandlerName = (handler: HandlerWithDogs) => {
    return `${handler.givenName} ${handler.surname}`
  }

  const getFilteredAndSortedDogsByHandlers = () => {
    if (!data?.dogsByHandlersInClub) return []

    const searchLower = searchQuery.toLowerCase()
    const dogsByHandlers = data.dogsByHandlersInClub
      .filter((handler: HandlerWithDogs) => {
        const handlerName = getHandlerName(handler).toLowerCase()

        if (searchLower && handlerName.includes(searchLower)) {
          return true
        }

        return (!searchLower && !handler.dogs?.length) || handler.dogs?.some((dog: DogWithBasicInfo) => {
          const matchesInactive = showInactive || dog.status === 'Active'
          const matchesSearch = searchQuery === '' ||
            dog.name.toLowerCase().includes(searchLower) ||
            (dog.crn?.toLowerCase() || '').includes(searchLower)
          return matchesInactive && matchesSearch
        })
      })
      .map((handler: HandlerWithDogs) => ({
        ...handler,
        dogs: handler.dogs?.filter((dog: DogWithBasicInfo) => {
          const handlerName = getHandlerName(handler).toLowerCase()
          const matchesHandler = searchLower && handlerName.includes(searchLower)
          const matchesInactive = showInactive || dog.status === 'Active'
          const matchesSearch = searchQuery === '' ||
            dog.name.toLowerCase().includes(searchLower) ||
            (dog.crn?.toLowerCase() || '').includes(searchLower)
          return (matchesHandler && matchesInactive) || matchesInactive && matchesSearch
        }).sort((a: DogWithBasicInfo, b: DogWithBasicInfo) => a.name.localeCompare(b.name)) || []
      }))
      .sort((a: HandlerWithDogs, b: HandlerWithDogs) => getHandlerName(a).localeCompare(getHandlerName(b)))

    return dogsByHandlers
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
        <h1>Handlers & Dogs</h1>
        <div>
          <Button variant="primary" className="me-2" onClick={() => navigate('/handlers/new')}>
            <PersonPlus className="me-2" />
            New Handler
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
            placeholder="Search handlers or dogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <Form.Check
          type="switch"
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

      {loading ? (
        <Container className="text-center mt-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Container>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th className="col-6 col-md-4">Name</th>
              <th className="col-3 col-md-2">CRN</th>
              <th className="d-none d-md-table-cell col-md-2">Status</th>
              <th className="col-2 col-md-2">Level</th>
              <th className="col-1 text-end">
                <span className="d-none d-md-inline">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedDogsByHandlers().length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  No matching handlers or dogs found
                </td>
              </tr>
            ) : (
              getFilteredAndSortedDogsByHandlers().map((handler: HandlerWithDogs) => {
                const handlerName = getHandlerName(handler)

                return (
                  <React.Fragment key={handler.id}>
                    <tr
                      className="table-secondary"
                      onClick={() => navigate(`/handlers/${handler.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td colSpan={5}>
                        <div className="d-flex justify-content-between align-items-center">
                          <strong>{handlerName}</strong>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/dogs/new?ownerId=${handler.id}`)
                            }}
                          >
                            <PlusLg className="me-1" />
                            New Dog
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {handler.dogs?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="ps-4 text-muted">
                          No active dogs
                        </td>
                      </tr>
                    ) : (
                      handler.dogs?.map((dog: DogWithBasicInfo) => (
                        <tr
                          key={dog.id}
                          onClick={() => handleRowClick(dog.id)}
                          style={{ cursor: 'pointer' }}
                          className={`align-middle`}
                        >
                          <td className={`ps-4 ${dog.status === 'Inactive' ? 'text-muted' : ''} col-6 col-md-4`}>{dog.name}</td>
                          <td className="font-monospace col-3 col-md-2">{dog.crn}</td>
                          <td className="d-none d-md-table-cell col-md-2">{getStatusBadge(dog.status)}</td>
                          <td className="col-2 col-md-2">{getTrainingLevelBadge(dog.trainingLevel)}</td>
                          <td className="col-1 text-nowrap text-end">
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
                      ))
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </Table>
      )}

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
