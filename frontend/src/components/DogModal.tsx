import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, Alert } from 'react-bootstrap'
import { useMutation, useQuery } from '@apollo/client'
import { CreateDog, UpdateDog, GetDogsByHandlersInClub } from '../graphql/dogs'
import { DogStatus, TrainingLevel } from '../graphql/generated/graphql'
import type { Dog } from '../graphql/generated/graphql'

type DogForModal = Pick<Dog, 'id' | 'name' | 'crn' | 'trainingLevel' | 'ownerId' | 'status'>
import { useClub } from '../contexts/ClubContext'
import { Save, PlusLg } from 'react-bootstrap-icons'

interface DogModalProps {
  show: boolean
  onHide: () => void
  dog?: DogForModal | null
  onSuccess?: () => void
}

function DogModal({ show, onHide, dog, onSuccess }: DogModalProps) {
  const { selectedClub } = useClub()
  const [formData, setFormData] = useState<Partial<Dog>>({
    name: '',
    trainingLevel: TrainingLevel.Beginner,
    clubId: selectedClub?.id || '',
    ownerId: '',
    status: DogStatus.Active
  })
  const [error, setError] = useState<string | null>(null)

  const { data: ownersData, loading: loadingOwners } = useQuery(GetDogsByHandlersInClub, {
    variables: { clubId: selectedClub?.id || '' },
    skip: !selectedClub?.id,
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
    if (dog) {
      setFormData({
        name: dog.name,
        crn: dog.crn,
        trainingLevel: dog.trainingLevel,
        ownerId: dog.ownerId,
        status: dog.status
      })
    } else {
      setFormData({
        name: '',
        trainingLevel: TrainingLevel.Beginner,
        clubId: selectedClub?.id || '',
        ownerId: '',
        status: DogStatus.Active
      })
    }
  }, [dog, selectedClub?.id])

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
      if (dog) {
        await updateDog({
          variables: {
            id: dog.id,
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
      ownerId: '',
      status: DogStatus.Active
    })
    setError(null)
    onHide()
  }

  const saving = creating || updating

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          {dog ? (
            <>
              <Save className="me-2" />
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
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={saving} className="d-flex align-items-center">
            <Save className="me-2" />
            {dog ? 'Save Changes' : 'Create Dog'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default DogModal
