import { config } from '../config'

export interface Club {
  ID: string
  Name: string
  NAFAClubNumber: string
  CreatedAt: string
  UpdatedAt: string
}

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
