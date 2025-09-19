import React, { useState } from 'react'

import { Container, Table, Button, Badge, Alert, Form, InputGroup, Breadcrumb } from 'react-bootstrap'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlusLg, Trash, PersonPlus, Pencil } from 'react-bootstrap-icons'
import { useMutation, useQuery } from '@apollo/client'

import type { DogStatus, Handler, Dog } from '../graphql/generated/graphql'
import { DeleteDog, GetDogById } from '../graphql/dogs'
import { getFilteredAndSortedDogsByHandlers, getHandlerName } from '../utils/dogsUtils'
import { useClub } from '../contexts/ClubContext'
import { useTheme } from '../contexts/ThemeContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDogModal } from '../hooks/useDogModal'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import DogModal from '../components/DogModal'
import TrainingLevelBadge from '../components/TrainingLevelBadge'
import { ToggleButton } from '../components/ToggleButton'

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
  const { selectedClub, dogsByHandlersInSelectedClub, error: clubError } = useClub()
  const { isDark } = useTheme()
  const { openCreateModal, DogModalComponent } = useDogModal()
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [dogToDelete, setDogToDelete] = useState<Dog | null>(null)
  const [dogToEdit, setDogToEdit] = useState<Dog | null>(null)
  const [showInactive, setShowInactive] = useState(searchParams.get('showInactive') === 'true')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortByHandlers, setSortByHandlers] = useState(searchParams.get('sortByHandlers') === 'true')

  useDocumentTitle('Handlers & Dogs')

  const [deleteDog] = useMutation(DeleteDog)

  // Get full dog data for editing
  const { data: dogData } = useQuery(GetDogById, {
    variables: { id: dogToEdit?.id || '' },
    skip: !dogToEdit?.id,
    onError: (error) => {
      setError('Failed to load dog details for editing.')
      console.error('Error loading dog:', error)
    }
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

  const handleSortByHandlersChange = (checked: boolean) => {
    setSortByHandlers(checked)
    setSearchParams(prev => {
      if (checked) {
        prev.set('sortByHandlers', 'true')
      } else {
        prev.delete('sortByHandlers')
      }
      return prev
    })
  }

  const handleRowClick = (dogId: string) => {
    navigate(`/dogs/${dogId}`)
  }

  const handleDelete = async (e: React.MouseEvent, dog: Dog) => {
    e.stopPropagation()
    setDogToDelete(dog)
    setShowDeleteModal(true)
  }

  const handleEdit = async (e: React.MouseEvent, dog: Dog) => {
    e.stopPropagation()
    setDogToEdit(dog)
    setShowEditModal(true)
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

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setDogToEdit(null)
    // The club context will automatically refetch the data
  }

  const filteredDogsByHandlers = getFilteredAndSortedDogsByHandlers(dogsByHandlersInSelectedClub, searchQuery, showInactive)

  // Create flat list of dogs for flat view
  const getFlatDogsList = () => {
    const allDogs: Array<Dog & { handler: Handler }> = []
    dogsByHandlersInSelectedClub.forEach(handler => {
      if (handler.dogs) {
        handler.dogs.forEach(dog => {
          if (showInactive || dog.status === 'Active') {
            allDogs.push({ ...dog, handler })
          }
        })
      }
    })

    // Filter by search query
    if (searchQuery) {
      return allDogs.filter(dog =>
        dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dog.crn && dog.crn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        getHandlerName(dog.handler).toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return allDogs.sort((a, b) => a.name.localeCompare(b.name))
  }

  const flatDogsList = getFlatDogsList()

  // Create unified data structure for rendering
  const getTableData = () => {
    if (sortByHandlers) {
      return filteredDogsByHandlers.map(handler => ({
        type: 'handler' as const,
        data: handler,
        dogs: handler.dogs || []
      }))
    } else {
      return flatDogsList.map(dogWithHandler => ({
        type: 'dog' as const,
        data: dogWithHandler,
        dogs: []
      }))
    }
  }

  const tableData = getTableData()

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
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/')}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Handlers & Dogs</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Handlers & Dogs</h2>
        <div className="d-flex gap-2">
          <Button variant="success" className="me-2 d-flex align-items-center" onClick={() => navigate('/handlers/new')}>
            <PersonPlus className="me-2" />
            New Handler
          </Button>
          <Button variant="primary" className="d-flex align-items-center" onClick={() => openCreateModal()}>
            <PlusLg className="me-2" />
            New Dog
          </Button>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3 mb-3">
        <InputGroup style={{ maxWidth: '300px' }}>
          <Form.Control
            type="text"
            placeholder="Filter handlers and dogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <div className="d-flex gap-2">
          <ToggleButton
            id="sort-by-handlers"
            checked={sortByHandlers}
            onChange={handleSortByHandlersChange}
            label="Sort by handlers"
            variant="primary"
          />
          <ToggleButton
            id="show-inactive"
            checked={showInactive}
            onChange={handleShowInactiveChange}
            label="Show inactive dogs"
            variant="secondary"
          />
        </div>
      </div>

      {(error || clubError) && (
        <Alert variant="danger" className="mb-4" onClose={() => { setError(null) }} dismissible>
          {error || clubError}
        </Alert>
      )}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th className="col-6 col-md-4">Name</th>
            <th className="col-3 col-md-2">CRN</th>
            {!sortByHandlers && <th className="col-3 col-md-3">Handler</th>}
            {showInactive && <th className="d-none d-md-table-cell col-md-2">Status</th>}
            <th className="col-2 col-md-2">Level</th>
            <th className="col-1 text-end">
              <span className="d-none d-md-inline">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tableData.length === 0 ? (
            <tr>
              <td colSpan={sortByHandlers ? 5 : 6} className="text-center text-muted py-4">
                No matching handlers or dogs found
              </td>
            </tr>
          ) : (
            tableData.map((item) => {
              if (item.type === 'handler') {
                const handler = item.data as Handler
                const handlerName = getHandlerName(handler)

                return (
                  <React.Fragment key={handler.id}>
                    <tr
                      className={`${isDark ? '' : 'table-secondary'} cur-point`}
                      onClick={() => navigate(`/handlers/${handler.id}`)}
                    >
                      <td colSpan={5}>
                        <div className="d-flex justify-content-between align-items-center">
                          <strong>{handlerName}</strong>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openCreateModal(handler.id)
                            }}
                          >
                            <PlusLg className="me-1" />
                            New Dog
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {item.dogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="ps-4 text-muted">
                          No active dogs
                        </td>
                      </tr>
                    ) : (
                      item.dogs.map((dog: Dog) => (
                        <tr
                          key={dog.id}
                          onClick={() => handleRowClick(dog.id)}
                          className={`align-middle cur-point`}
                        >
                          <td className={`ps-4 ${dog.status === 'Inactive' ? 'text-muted' : ''} col-6 col-md-4`}>{dog.name}</td>
                          <td className="font-monospace col-3 col-md-2">{dog.crn}</td>
                          {showInactive && <td className="d-none d-md-table-cell col-md-2">{getStatusBadge(dog.status)}</td>}
                          <td className="col-2 col-md-2">
                            <TrainingLevelBadge level={dog.trainingLevel} />
                          </td>
                          <td className="col-1 text-nowrap text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={(e) => handleEdit(e, dog)}
                              >
                                <Pencil className="me-md-1" />
                                <span className="d-none d-md-inline">Edit</span>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={(e) => handleDelete(e, dog)}
                              >
                                <Trash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                )
              } else {
                const dogWithHandler = item.data as Dog & { handler: Handler }

                return (
                  <tr
                    key={dogWithHandler.id}
                    onClick={() => handleRowClick(dogWithHandler.id)}
                    className={`align-middle cur-point`}
                  >
                    <td className={`${dogWithHandler.status === 'Inactive' ? 'text-muted' : ''} col-6 col-md-4`}>{dogWithHandler.name}</td>
                    <td className="font-monospace col-3 col-md-2">{dogWithHandler.crn}</td>
                    <td className="col-3 col-md-3">{getHandlerName(dogWithHandler.handler)}</td>
                    {showInactive && <td className="d-none d-md-table-cell col-md-2">{getStatusBadge(dogWithHandler.status)}</td>}
                    <td className="col-2 col-md-2">
                      <TrainingLevelBadge level={dogWithHandler.trainingLevel} />
                    </td>
                    <td className="col-1 text-nowrap text-end">
                      <div className="d-flex gap-1 justify-content-end">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={(e) => handleEdit(e, dogWithHandler)}
                        >
                          <Pencil className="me-md-1" />
                          <span className="d-none d-md-inline">Edit</span>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={(e) => handleDelete(e, dogWithHandler)}
                        >
                          <Trash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              }
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

      <DogModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false)
          setDogToEdit(null)
        }}
        dog={dogData?.dog || null}
        onSuccess={handleEditSuccess}
      />

      <DogModalComponent />
    </Container>
  )
}

export default Dogs
