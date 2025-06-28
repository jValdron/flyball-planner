import { AttendanceStatus } from '../graphql/generated/graphql'
import type { Dog } from '../graphql/generated/graphql'

// Virtual attendance record for dogs without attendance records
export interface VirtualAttendanceData {
  id: string
  dogId: string
  attending: AttendanceStatus
  practiceId: string
  createdAt: string
  updatedAt: string
  isVirtual: true
  dog?: Dog
}

// Extended attendance type that includes virtual records
export type ExtendedAttendanceData = {
  id: string
  dogId: string
  attending: AttendanceStatus
  practiceId?: string
  createdAt: string | Date
  updatedAt: string | Date
  dog?: Dog
  isVirtual?: boolean
  __typename?: string
}

// Union type for merged attendance data
export type MergedAttendanceData = ExtendedAttendanceData | VirtualAttendanceData
