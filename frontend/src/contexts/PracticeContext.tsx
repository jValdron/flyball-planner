import React, { createContext, useContext, useState, useCallback } from 'react'
import { AttendanceStatus } from '../graphql/generated/graphql'
import type { PracticeAttendance } from '../graphql/generated/graphql'

interface PracticeContextType {
  attendances: Partial<PracticeAttendance>[]
  setAttendances: (attendances: Partial<PracticeAttendance>[]) => void
  addAttendance: (attendance: Partial<PracticeAttendance>) => void
  updateAttendance: (dogId: string, attending: AttendanceStatus) => void
  getAttendance: (dogId: string) => AttendanceStatus | undefined
  isAttendancesLoading: boolean
  setIsAttendancesLoading: (loading: boolean) => void
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined)

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const [attendances, setAttendances] = useState<Partial<PracticeAttendance>[]>([])
  const [isAttendancesLoading, setIsAttendancesLoading] = useState(false)

  const addAttendance = useCallback((attendance: Partial<PracticeAttendance>) => {
    setAttendances(prev => [...prev, attendance])
  }, [])

  const updateAttendance = useCallback((dogId: string, attending: AttendanceStatus) => {
    setAttendances(prev =>
      prev.map(a => a.dogId === dogId ? { ...a, attending } : a)
    )
  }, [])

  const getAttendance = useCallback((dogId: string) => {
    return attendances.find(a => a.dogId === dogId)?.attending
  }, [attendances])

  return (
    <PracticeContext.Provider value={{
      attendances,
      setAttendances,
      addAttendance,
      updateAttendance,
      getAttendance,
      isAttendancesLoading,
      setIsAttendancesLoading
    }}>
      {children}
    </PracticeContext.Provider>
  )
}

export function usePractice() {
  const context = useContext(PracticeContext)
  if (context === undefined) {
    throw new Error('usePractice must be used within a PracticeProvider')
  }
  return context
}
