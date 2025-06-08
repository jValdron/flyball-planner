import { config } from '../config'
import type { Dog } from './dogService'

export interface Owner {
  ID: string
  GivenName: string
  Surname: string
  ClubID: string
  Dogs: string[] // Array of dog IDs
  CreatedAt: string
  UpdatedAt: string
}

export const ownerService = {
  async getOwners(): Promise<Owner[]> {
    const response = await fetch(`${config.endpoints.owners}`)
    if (!response.ok) {
      throw new Error('Failed to fetch owners')
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
