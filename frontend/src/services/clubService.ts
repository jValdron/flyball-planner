import { config } from '../config'
import type { Club } from '../contexts/ClubContext'

export { type Club }

export const clubService = {
  async getAllClubs(): Promise<Club[]> {
    const response = await fetch(config.endpoints.clubs)
    if (!response.ok) {
      throw new Error('Failed to fetch clubs')
    }
    return response.json()
  },

  async getClub(id: string): Promise<Club> {
    const response = await fetch(`${config.endpoints.clubs}/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch club')
    }
    return response.json()
  },

  async updateClub(id: string, club: Partial<Club>): Promise<Club> {
    const response = await fetch(`${config.endpoints.clubs}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(club),
    })
    if (!response.ok) {
      throw new Error('Failed to update club')
    }
    return response.json()
  }
}
