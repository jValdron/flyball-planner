import { Container, Form, Button, Alert, Spinner, Breadcrumb } from 'react-bootstrap'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { dogService, type Dog } from '../services/dogService'
import { ownerService, type Owner } from '../services/ownerService'
import { useClub } from '../contexts/ClubContext'
import { ChevronLeft, Save, Trash } from 'react-bootstrap-icons'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'

type DogFormData = Omit<Dog, 'ID' | 'CreatedAt' | 'UpdatedAt'>

function DogView() {
  const navigate = useNavigate()
  const { dogId } = useParams()
  const [searchParams] = useSearchParams()
  const { selectedClub } = useClub()
  const [dog, setDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [owners, setOwners] = useState<Owner[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<DogFormData>({
    Name: '',
    CRN: '',
    TrainingLevel: 1,
    ClubID: selectedClub?.ID || '',
    OwnerID: searchParams.get('ownerId') || '',
    Status: 'Active'
  })

  useEffect(() => {
    if (dogId && selectedClub) {
      loadDog()
    } else {
      setLoading(false)
    }
    loadOwners()
  }, [dogId, selectedClub])

  const loadOwners = async () => {
    try {
      const data = await ownerService.getOwners()
      setOwners(data)
    } catch (err) {
      console.error('Error loading owners:', err)
    }
  }

  const loadDog = async () => {
    try {
      setLoading(true)
      setError(null)
      if (!selectedClub) return
      let data: Dog = await dogService.getDogByClub(selectedClub.ID, dogId!)
      setDog(data)
      setFormData({
        Name: data.Name,
        CRN: data.CRN,
        TrainingLevel: data.TrainingLevel,
        ClubID: data.ClubID,
        OwnerID: data.OwnerID,
        Status: data.Status
      })
    } catch (err) {
      setError('Failed to load dog details. Please try again later.')
      console.error('Error loading dog:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'TrainingLevel' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      if (dogId) {
        await dogService.updateDog(formData.OwnerID, dogId, formData)
      } else {
        await dogService.createDog(formData.OwnerID, {
          Name: formData.Name,
          CRN: formData.CRN,
          ClubID: formData.ClubID,
          TrainingLevel: formData.TrainingLevel,
          OwnerID: formData.OwnerID,
          Status: formData.Status
        })
      }
      navigate('/dogs')
    } catch (err) {
      setError('Failed to save dog. Please try again later.')
      console.error('Error saving dog:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSaving(true)
      setError(null)
      if (!dogId || !selectedClub) return
      await dogService.deleteDog(selectedClub.ID, dogId)
      navigate('/dogs')
    } catch (err) {
      setError('Failed to delete dog. Please try again later.')
      console.error('Error deleting dog:', err)
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
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

  return (
    <Container>
      <Breadcrumb className="mt-3">
        <div className="breadcrumb-item" onClick={() => navigate('/dogs')} style={{ cursor: 'pointer' }}>Dogs</div>
        <Breadcrumb.Item active>
          {dogId ? 'Edit Dog' : 'Add New Dog'}
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{dogId ? 'Edit Dog' : 'Add New Dog'}</h1>
        {dogId && (
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
          >
            <Trash className="me-2" />
            Delete Dog
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            name="Name"
            value={formData.Name}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select
            name="Status"
            value={formData.Status}
            onChange={handleInputChange}
            required
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>CRN</Form.Label>
          <Form.Control
            type="text"
            name="CRN"
            value={formData.CRN}
            onChange={handleInputChange}
            className="font-monospace"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Training Level</Form.Label>
          <Form.Select
            name="TrainingLevel"
            value={formData.TrainingLevel}
            onChange={handleInputChange}
            required
          >
            <option value={1}>Beginner</option>
            <option value={2}>Novice</option>
            <option value={3}>Intermediate</option>
            <option value={4}>Advanced</option>
            <option value={5}>Solid</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Owner</Form.Label>
          <Form.Select
            name="OwnerID"
            value={formData.OwnerID}
            onChange={handleInputChange}
            required
          >
            <option value="">Select an owner</option>
            {owners.map(owner => (
              <option key={owner.ID} value={owner.ID}>
                {`${owner.GivenName} ${owner.Surname}`}
              </option>
            ))}
          </Form.Select>
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
          <Button type="submit" variant="success">
            <Save className="me-2" />
            {dogId ? 'Save Changes' : 'Create Dog'}
          </Button>
        </div>
      </Form>

      <DeleteConfirmationModal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Dog"
        message={`Are you sure you want to delete ${dog?.Name}? This action cannot be undone.`}
      />

      {dog && (
        <div className="text-muted">
          <p><strong>Created:</strong> {new Date(dog.CreatedAt).toLocaleString()}</p>
          <p><strong>Last Updated:</strong> {new Date(dog.UpdatedAt).toLocaleString()}</p>
        </div>
      )}
    </Container>
  )
}

export default DogView
