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

  async deleteOwner(ownerId: string): Promise<void> {
    const response = await fetch(`${config.endpoints.owners}/${ownerId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete owner')
    }
  },

  async updateOwner(ownerId: string, owner: Partial<Owner>): Promise<Owner> {
    const response = await fetch(`${config.endpoints.owners}/${ownerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(owner),
    })
    if (!response.ok) {
      throw new Error('Failed to update owner')
    }
    return response.json()
  },

  async createOwner(owner: Omit<Owner, 'ID' | 'CreatedAt' | 'UpdatedAt'>): Promise<Owner> {
    const response = await fetch(`${config.endpoints.owners}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(owner),
    })
    if (!response.ok) {
      throw new Error('Failed to create owner')
    }
    return response.json()
  }
}
