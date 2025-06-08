import { config } from '../config'

export interface Practice {
  id: number
  title: string
  description: string
  date: string
  time: string
  type: string
}

export const practiceService = {
  async getPractices(): Promise<Practice[]> {
    const response = await fetch(config.endpoints.practices)
    if (!response.ok) {
      throw new Error('Failed to fetch practices')
    }
    return response.json()
  },

  async createPractice(practice: Omit<Practice, 'id'>): Promise<Practice> {
    const response = await fetch(config.endpoints.practices, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(practice),
    })
    if (!response.ok) {
      throw new Error('Failed to create practice')
    }
    return response.json()
  },

  async updatePractice(id: number, practice: Partial<Practice>): Promise<Practice> {
    const response = await fetch(`${config.endpoints.practices}/${id}`, {
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

  async deletePractice(id: number): Promise<void> {
    const response = await fetch(`${config.endpoints.practices}/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete practice')
    }
  }
}
