import React, { useEffect, useState } from 'react'
import { Container, Button, Alert, Spinner, Form, Breadcrumb } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { ownerService } from '../services/ownerService'
import type { Owner } from '../services/ownerService'
import { useClub } from '../contexts/ClubContext'
import { Trash, PlusLg, ChevronLeft, Save } from 'react-bootstrap-icons'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'

type OwnerFormData = {
  GivenName: string
  Surname: string
}

function OwnerView() {
  const navigate = useNavigate()
  const { ownerId } = useParams<{ ownerId: string }>()
  const { selectedClub } = useClub()
  const [owner, setOwner] = useState<Owner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState<OwnerFormData>({
    GivenName: '',
    Surname: ''
  })

  const isNewOwner = ownerId === 'new'

  useEffect(() => {
    if (selectedClub) {
      if (ownerId && !isNewOwner) {
        loadOwner()
      } else {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [ownerId, selectedClub, isNewOwner])

  const loadOwner = async () => {
    try {
      setLoading(true)
      setError(null)
      if (!ownerId || !selectedClub) return

      // Get owner details
      const owners = await ownerService.getOwners()
      const foundOwner = owners.find(o => o.ID === ownerId)
      if (!foundOwner) {
        throw new Error('Owner not found')
      }
      setOwner(foundOwner)
      setFormData({
        GivenName: foundOwner.GivenName,
        Surname: foundOwner.Surname
      })
    } catch (err) {
      setError('Failed to load owner details. Please try again later.')
      console.error('Error loading owner:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent, redirectToNewDog: boolean = false) => {
    e.preventDefault()
    try {
      setError(null)
      setSaving(true)
      if (ownerId && !isNewOwner) {
        await ownerService.updateOwner(ownerId, formData)
        if (redirectToNewDog) {
          navigate(`/dogs/new?ownerId=${ownerId}`)
        } else {
          navigate('/dogs')
        }
      } else {
        if (!selectedClub) return
        const newOwner = await ownerService.createOwner({
          ...formData,
          ClubID: selectedClub.ID,
          Dogs: []
        })
        if (redirectToNewDog) {
          navigate(`/dogs/new?ownerId=${newOwner.ID}`)
        } else {
          navigate('/dogs')
        }
      }
    } catch (err) {
      setError('Failed to save owner details. Please try again later.')
      console.error('Error saving owner:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOwner = async () => {
    if (!owner) return
    try {
      setSaving(true)
      await ownerService.deleteOwner(owner.ID)
      navigate('/dogs')
    } catch (err) {
      setError('Failed to delete owner. Please try again later.')
      console.error('Error deleting owner:', err)
    } finally {
      setSaving(false)
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
          Please select a club to view owner details.
        </Alert>
      </Container>
    )
  }

  return (
    <Container>
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteOwner}
        title="Delete Owner"
        message={`Are you sure you want to delete ${owner?.GivenName} ${owner?.Surname}? This action cannot be undone.`}
        confirmButtonText="Delete Owner"
      />
      <Breadcrumb className="mt-3">
        <div className="breadcrumb-item" onClick={() => navigate('/dogs')} style={{ cursor: 'pointer' }}>Dogs</div>
        <Breadcrumb.Item active>
          {isNewOwner ? 'Add New Owner' : `${owner?.GivenName} ${owner?.Surname}`}
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isNewOwner ? 'Add New Owner' : 'Edit Owner'}</h1>
        <div className="d-flex gap-2">
          {!isNewOwner && owner && (
            <>
              <Button variant="success" onClick={() => navigate(`/dogs/new?ownerId=${owner.ID}`)}>
                <PlusLg className="me-2" />
                Add Dog
              </Button>
              <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)}>
                <Trash className="me-2" />
                Delete Owner
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Given Name</Form.Label>
          <Form.Control
            type="text"
            name="GivenName"
            value={formData.GivenName}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Surname</Form.Label>
          <Form.Control
            type="text"
            name="Surname"
            value={formData.Surname}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <div className="d-flex gap-2 mt-4 justify-content-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/dogs')}
            disabled={saving}
          >
            <ChevronLeft className="me-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            <Save className="me-2" />
            {isNewOwner ? 'Create Owner' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="success"
            onClick={(e) => handleSubmit(e, true)}
            disabled={saving}
          >
            <Save className="me-2" />
            Save & Add Dog
          </Button>
        </div>

        {!isNewOwner && owner && (
            <div className="text-muted">
                <p><strong>Created:</strong> {new Date(owner.CreatedAt).toLocaleString()}</p>
                <p><strong>Last Updated:</strong> {new Date(owner.UpdatedAt).toLocaleString()}</p>
            </div>
        )}
      </Form>
    </Container>
  )
}

export default OwnerView
