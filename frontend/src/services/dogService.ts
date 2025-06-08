import { config } from '../config'

export interface Dog {
  ID: string
  Name: string
  CRN: string
  OwnerID: string
  ClubID: string
  TrainingLevel: number
  CreatedAt: string
  UpdatedAt: string
}

export const dogService = {
  async getDogsByClub(clubId: string): Promise<Dog[]> {
    const response = await fetch(`${config.endpoints.clubs}/${clubId}/dogs`)
    if (!response.ok) {
      throw new Error('Failed to fetch club dogs')
    }
    return response.json()
  },

  async getDogByClub(clubId: string, dogId: string): Promise<Dog> {
    const response = await fetch(`${config.endpoints.clubs}/${clubId}/dogs/${dogId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch dog for this club')
    }
    return response.json()
  }
}
