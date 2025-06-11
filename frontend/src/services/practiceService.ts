import { config } from '../config'

export type PracticeStatus = 'Draft' | 'Ready'

export interface Practice {
  ID: string
  ClubId: string
  ScheduledAt: string
  Status: PracticeStatus
  CreatedAt: string
  UpdatedAt: string
}

export const practiceService = {
  async getPractices(clubId: string): Promise<Practice[]> {
    const response = await fetch(`${config.endpoints.clubs}/${clubId}/practices`)
    if (!response.ok) {
      throw new Error('Failed to fetch practices')
    }
    return response.json()
  },

  async getPractice(clubId: string, id: string): Promise<Practice> {
    const response = await fetch(`${config.endpoints.clubs}/${clubId}/practices/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch practice')
    }
    return response.json()
  },

  async createPractice(clubId: string, practice: Omit<Practice, 'ID' | 'CreatedAt' | 'UpdatedAt'>): Promise<Practice> {
    const response = await fetch(`${config.endpoints.clubs}/${clubId}/practices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(practice),
    })
    if (!response.ok) {
      throw new Error('Failed to create practice: ' + await response.text())
    }
    return response.json()
  },

  async updatePractice(clubId: string, id: string, practice: Partial<Practice>): Promise<Practice> {
    const response = await fetch(`${config.endpoints.clubs}/${clubId}/practices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(practice),
    })
    if (!response.ok) {
      throw new Error('Failed to update practice')
    }
    return response.json()
  },

  async deletePractice(clubId: string, id: string): Promise<void> {
    const response = await fetch(`${config.endpoints.clubs}/${clubId}/practices/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete practice')
    }
  }
}
