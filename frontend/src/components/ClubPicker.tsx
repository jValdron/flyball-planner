import { Form } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { clubService, type Club } from '../services/clubService'
import { useClub } from '../contexts/ClubContext'

export function ClubPicker() {
  const { selectedClub, setSelectedClub } = useClub()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadClubs = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await clubService.getAllClubs()
        setClubs(data)
        if (!selectedClub && data.length > 0) {
          setSelectedClub(data[0])
        }
      } catch (err) {
        setError('Failed to load clubs')
        console.error('Error loading clubs:', err)
      } finally {
        setLoading(false)
      }
    }
    loadClubs()
  }, [])

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clubId = e.target.value
    try {
      const club = clubs.find(c => c.ID === clubId)
      if (!club) throw new Error('Club not found')
      setSelectedClub(club)
    } catch (err) {
      console.error('Error loading club details:', err)
    }
  }

  if (loading) {
    return <div>Loading clubs...</div>
  }

  if (error) {
    return <div className="text-danger">{error}</div>
  }

  return (
    <Form.Select
      value={selectedClub?.ID || ''}
      onChange={handleChange}
      aria-label="Select club"
      className="w-auto"
    >
      {clubs.map((club) => (
        <option key={club.ID} value={club.ID}>
          {club.Name}
        </option>
      ))}
    </Form.Select>
  )
}
