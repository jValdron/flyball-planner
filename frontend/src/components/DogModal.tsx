import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'

import { Modal, Form, Button, Alert } from 'react-bootstrap'
import { Save, PlusLg, X, Pencil } from 'react-bootstrap-icons'
import { useMutation, useQuery } from '@apollo/client'

import type { Dog } from '../graphql/generated/graphql'
import { DogStatus, TrainingLevel } from '../graphql/generated/graphql'
import { CreateDog, UpdateDog, GetDogsByHandlersInClub } from '../graphql/dogs'
import { useClub } from '../contexts/ClubContext'

type DogForModal = Pick<Dog, 'id' | 'name' | 'crn' | 'trainingLevel' | 'ownerId' | 'status'>

interface DogModalProps {
  show?: boolean
  onHide?: () => void
  dog?: DogForModal | null
  ownerId?: string
  onSuccess?: () => void
}

export interface DogModalRef {
  open: (options?: { dog?: DogForModal | null; ownerId?: string }) => void
  close: () => void
}

const DogModal = forwardRef<DogModalRef, DogModalProps>(({ show, onHide, dog, ownerId, onSuccess }, ref) => {
  const { selectedClub } = useClub()
  const [isOpen, setIsOpen] = useState(show || false)
  const [currentDog, setCurrentDog] = useState<DogForModal | null>(dog || null)
  const [currentOwnerId, setCurrentOwnerId] = useState<string | undefined>(ownerId)
  const [formData, setFormData] = useState<Partial<Dog>>({
    name: '',
    trainingLevel: TrainingLevel.Beginner,
    clubId: selectedClub?.id || '',
    ownerId: '',
    status: DogStatus.Active
  })
  const [error, setError] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    open: (options?: { dog?: DogForModal | null; ownerId?: string }) => {
      if (options?.dog) {
        setCurrentDog(options.dog)
      } else {
        setCurrentDog(null)
      }
      if (options?.ownerId !== undefined) {
        setCurrentOwnerId(options.ownerId)
      } else {
        setCurrentOwnerId(undefined)
      }
      setIsOpen(true)
    },
    close: () => {
      setIsOpen(false)
    }
  }))

  const { data: ownersData, loading: loadingOwners } = useQuery(GetDogsByHandlersInClub, {
    variables: { clubId: selectedClub?.id || '' },
    skip: !selectedClub?.id || !isOpen,
    onError: (error) => {
      console.error('Error loading owners:', error)
    }
  })

  const [createDog, { loading: creating }] = useMutation(CreateDog, {
    onCompleted: () => {
      onSuccess?.()
      handleClose()
    },
    onError: (error) => {
      setError('Failed to create dog. Please try again later.')
      console.error('Error creating dog:', error)
    }
  })

  const [updateDog, { loading: updating }] = useMutation(UpdateDog, {
    onCompleted: () => {
      onSuccess?.()
      handleClose()
    },
    onError: (error) => {
      setError('Failed to update dog. Please try again later.')
      console.error('Error updating dog:', error)
    }
  })

  useEffect(() => {
    if (show !== undefined) {
      setIsOpen(show)
      if (show) {
        if (dog) {
          setCurrentDog(dog)
          setFormData({
            name: dog.name,
            crn: dog.crn,
            trainingLevel: dog.trainingLevel,
            ownerId: dog.ownerId,
            status: dog.status
          })
        } else {
          setCurrentDog(null)
          setFormData({
            name: '',
            trainingLevel: TrainingLevel.Beginner,
            clubId: selectedClub?.id || '',
            ownerId: ownerId || '',
            status: DogStatus.Active
          })
        }
        if (ownerId !== undefined) {
          setCurrentOwnerId(ownerId)
        }
      }
    }
  }, [show, dog, ownerId, selectedClub?.id])


  // Update form data when current dog or owner changes (for programmatic updates)
  useEffect(() => {
    if (currentDog && !show) {
      setFormData({
        name: currentDog.name,
        crn: currentDog.crn,
        trainingLevel: currentDog.trainingLevel,
        ownerId: currentDog.ownerId,
        status: currentDog.status
      })
    } else if (!currentDog && !show) {
      setFormData({
        name: '',
        trainingLevel: TrainingLevel.Beginner,
        clubId: selectedClub?.id || '',
        ownerId: currentOwnerId || '',
        status: DogStatus.Active
      })
    }
  }, [currentDog, currentOwnerId, selectedClub?.id, show])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'trainingLevel' ? value as TrainingLevel : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      if (currentDog) {
        await updateDog({
          variables: {
            id: currentDog.id,
            ...formData
          }
        })
      } else {
        await createDog({
          variables: {
            ...formData,
            clubId: selectedClub?.id || ''
          } as any
        })
      }
    } catch (err) {
      // Error handled in onError
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      trainingLevel: TrainingLevel.Beginner,
      clubId: selectedClub?.id || '',
      ownerId: currentOwnerId || '',
      status: DogStatus.Active
    })
    setError(null)
    setIsOpen(false)
    onHide?.()
  }

  const saving = creating || updating

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          {currentDog ? (
            <>
              <Pencil className="me-2" />
              Edit Dog
            </>
          ) : (
            <>
              <PlusLg className="me-2" />
              Add New Dog
            </>
          )}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
            >
              <option value={DogStatus.Active}>Active</option>
              <option value={DogStatus.Inactive}>Inactive</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>CRN</Form.Label>
            <Form.Control
              type="text"
              name="crn"
              value={formData.crn || ''}
              onChange={handleInputChange}
              className="font-monospace"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Training Level</Form.Label>
            <Form.Select
              name="trainingLevel"
              value={formData.trainingLevel}
              onChange={handleInputChange}
              required
            >
              <option value={TrainingLevel.Beginner}>Beginner</option>
              <option value={TrainingLevel.Novice}>Novice</option>
              <option value={TrainingLevel.Intermediate}>Intermediate</option>
              <option value={TrainingLevel.Advanced}>Advanced</option>
              <option value={TrainingLevel.Solid}>Solid</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Owner</Form.Label>
            <Form.Select
              name="ownerId"
              value={formData.ownerId}
              onChange={handleInputChange}
              required
              disabled={loadingOwners}
            >
              <option value="">Select an owner</option>
              {ownersData?.dogsByHandlersInClub?.map(handler => (
                <option key={handler.id} value={handler.id}>
                  {`${handler.givenName} ${handler.surname}`}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            <X className="me-2" />
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={saving} className="d-flex align-items-center">
            <Save className="me-2" />
            {currentDog ? 'Save Changes' : 'Create Dog'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
})

DogModal.displayName = 'DogModal'

export default DogModal
