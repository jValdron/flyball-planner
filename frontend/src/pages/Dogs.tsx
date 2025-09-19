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
        <h1>Handlers & Dogs</h1>
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
            {showInactive && <th className="d-none d-md-table-cell col-md-2">Status</th>}
            <th className="col-2 col-md-2">Level</th>
            <th className="col-1 text-end">
              <span className="d-none d-md-inline">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredDogsByHandlers.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted py-4">
                No matching handlers or dogs found
              </td>
            </tr>
          ) : (
            filteredDogsByHandlers.map((handler: Handler) => {
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
                  {handler.dogs?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ps-4 text-muted">
                        No active dogs
                      </td>
                    </tr>
                  ) : (
                    handler.dogs?.map((dog: Dog) => (
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
