import { config } from '../config'

export enum AttendanceStatus {
  Unknown = 0,
  No = 1,
  Yes = 2
}

export interface PracticeAttendance {
  ID: string
  PracticeID: string
  DogID: string
  Attending: AttendanceStatus
  CreatedAt: string
  UpdatedAt: string
}

export interface AttendanceUpdate {
  dogId: string
  status: AttendanceStatus
}

export interface AttendanceResponse {
  attendances: Record<string, AttendanceStatus>
}

export const attendanceService = {
  async getAttendances(clubId: string, practiceId: string): Promise<Record<string, AttendanceStatus>> {
    const response = await fetch(`${config.endpoints.clubs}/${clubId}/practices/${practiceId}/attendance`)
    if (!response.ok) {
      throw new Error('Failed to fetch attendances')
    }
    const data: AttendanceResponse = await response.json()
    return data.attendances
  },

  async updateAttendances(clubId: string, practiceId: string, updates: AttendanceUpdate[]): Promise<PracticeAttendance[]> {
    const response = await fetch(`${config.endpoints.clubs}/${clubId}/practices/${practiceId}/attendance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates: updates.map(update => ({
          DogID: update.dogId,
          Attending: update.status
        }))
      })
    })
    if (!response.ok) {
      throw new Error('Failed to update attendances')
    }
    return response.json()
  }
}
