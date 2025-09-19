import React from 'react'

import { Dropdown } from 'react-bootstrap'
import { Check } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'

import type { GetClubsQuery, Club } from '../graphql/generated/graphql'
import { GetClubs } from '../graphql/clubs'
import { useAuth } from '../contexts/AuthContext'
import { useClub } from '../contexts/ClubContext'
import { ThemeToggle } from './ThemeToggle'
import { getGravatarUrl } from '../utils/gravatar'

export const UserDropdown: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { selectedClub, setSelectedClub } = useClub()
  const { loading, error, data } = useQuery<GetClubsQuery>(GetClubs)

  React.useEffect(() => {
    if (data?.clubs && !selectedClub && data.clubs.length > 0) {
      setSelectedClub(data.clubs[0] as Club)
    }
  }, [data, selectedClub, setSelectedClub])

  if (!user) {
    return null
  }

  const handleClubSelect = (clubId: string) => {
    const club = data?.clubs.find((c) => c.id === clubId)
    if (club) {
      setSelectedClub(club as Club)
    }
  }

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="outline-light"
        size="sm"
        className="d-flex align-items-center gap-2"
      >
        <img
          src={getGravatarUrl(user.email, 24)}
          alt={`${user.firstName} ${user.lastName}`}
          className="rounded-circle"
          style={{ width: '24px', height: '24px' }}
          onError={(e) => {
            // Fallback to a default avatar if Gravatar fails to load
            const target = e.target as HTMLImageElement
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&size=24&background=6c757d&color=ffffff&format=svg`
          }}
        />
        <span className="d-none d-md-inline">
          {user.firstName} @ {selectedClub?.name || 'No Club'}
        </span>
        <span className="d-md-none">
          {user.firstName}
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Header>
          {user.username}
        </Dropdown.Header>

        <Dropdown.Item onClick={() => navigate('/account')}>
          Account Details
        </Dropdown.Item>

        <Dropdown.Item onClick={logout} className="text-danger">
          Logout
        </Dropdown.Item>

        <Dropdown.Divider />

        {loading && <Dropdown.Item disabled>Loading clubs...</Dropdown.Item>}
        {error && <Dropdown.Item disabled className="text-danger">Failed to load clubs</Dropdown.Item>}
        {data?.clubs.map((club) => (
          <Dropdown.Item
            key={club.id}
            onClick={() => handleClubSelect(club.id)}
            active={selectedClub?.id === club.id}
          >
            <div className="d-flex align-items-center">
              <div className="me-2" style={{ width: '16px' }}>
                {selectedClub?.id === club.id && <Check />}
              </div>
              {club.name}
            </div>
          </Dropdown.Item>
        ))}

        <Dropdown.Divider />

        <ThemeToggle />
      </Dropdown.Menu>
    </Dropdown>
  )
}
