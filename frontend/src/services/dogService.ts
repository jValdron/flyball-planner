import { config } from '../config'

export type DogStatus = 'Active' | 'Inactive'

export interface Dog {
  ID: string
  Name: string
  CRN: string
  OwnerID: string
  ClubID: string
  TrainingLevel: number
  Status: DogStatus
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
  },

  async createDog(ownerId: string, dog: Omit<Dog, 'ID' | 'CreatedAt' | 'UpdatedAt'>): Promise<Dog> {
    const response = await fetch(`${config.endpoints.owners}/${ownerId}/dogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dog),
    })
    if (!response.ok) {
      throw new Error('Failed to create dog')
    }
    return response.json()
  },

  async updateDog(ownerId: string, dogId: string, dog: Partial<Dog>): Promise<Dog> {
    const response = await fetch(`${config.endpoints.owners}/${ownerId}/dogs/${dogId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dog),
    })
    if (!response.ok) {
      throw new Error('Failed to update dog')
    }
    return response.json()
  },

  async deleteDog(ownerId: string, dogId: string): Promise<void> {
    const response = await fetch(`${config.endpoints.owners}/${ownerId}/dogs/${dogId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete dog')
    }
  }
}
