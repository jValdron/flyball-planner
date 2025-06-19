import React, { createContext, useContext, useState, useCallback } from 'react'
import { AttendanceStatus } from '../graphql/generated/graphql'
import type { PracticeAttendance, Set } from '../graphql/generated/graphql'

interface PracticeContextType {
  attendances: Partial<PracticeAttendance>[]
  setAttendances: (attendances: Partial<PracticeAttendance>[]) => void
  addAttendance: (attendance: Partial<PracticeAttendance>) => void
  updateAttendance: (dogId: string, attending: AttendanceStatus) => void
  getAttendance: (dogId: string) => AttendanceStatus | undefined
  isAttendancesLoading: boolean
  setIsAttendancesLoading: (loading: boolean) => void
  sets: Partial<Set>[]
  setSets: (sets: Partial<Set>[]) => void
  addSet: (set: Partial<Set>) => void
  updateSet: (setId: string, updates: Partial<Set>) => void
  removeSet: (setId: string) => void
  isSetsLoading: boolean
  setIsSetsLoading: (loading: boolean) => void
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined)

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const [attendances, setAttendances] = useState<Partial<PracticeAttendance>[]>([])
  const [isAttendancesLoading, setIsAttendancesLoading] = useState(false)
  const [sets, setSets] = useState<Partial<Set>[]>([])
  const [isSetsLoading, setIsSetsLoading] = useState(false)

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

  const addSet = useCallback((set: Partial<Set>) => {
    setSets(prev => [...prev, set])
  }, [])

  const updateSet = useCallback((setId: string, updates: Partial<Set>) => {
    setSets(prev =>
      prev.map(s => s.id === setId ? { ...s, ...updates } : s)
    )
  }, [])

  const removeSet = useCallback((setId: string) => {
    setSets(prev => prev.filter(s => s.id !== setId))
  }, [])

  return (
    <PracticeContext.Provider value={{
      attendances,
      setAttendances,
      addAttendance,
      updateAttendance,
      getAttendance,
      isAttendancesLoading,
      setIsAttendancesLoading,
      sets,
      setSets,
      addSet,
      updateSet,
      removeSet,
      isSetsLoading,
      setIsSetsLoading
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
