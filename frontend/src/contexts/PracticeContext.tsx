import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useReducer } from 'react'
import { useSubscription, useQuery } from '@apollo/client'
import {
  PRACTICE_CHANGED_SUBSCRIPTION,
  PRACTICE_ATTENDANCE_CHANGED_SUBSCRIPTION,
  PRACTICE_SET_CHANGED_SUBSCRIPTION
} from '../graphql/subscriptions'
import { GetPractice } from '../graphql/practice'
import { AttendanceStatus } from '../graphql/generated/graphql'
import type {
  PracticeChangedSubscription,
  PracticeAttendanceChangedSubscription,
  PracticeSetChangedSubscription,
  GetPracticeQuery
} from '../graphql/generated/graphql'
import { useClub } from './ClubContext'
import type { VirtualAttendanceData, MergedAttendanceData } from '../types/attendance'

// Types for the practice data we're managing
type PracticeData = NonNullable<GetPracticeQuery['practice']>
type PracticeAttendanceData = NonNullable<GetPracticeQuery['practice']>['attendances'][0]
type SetData = NonNullable<GetPracticeQuery['practice']>['sets'][0]

interface PracticeContextType {
  // Practice data
  practice: PracticeData | null
  isPracticeLoading: boolean
  practiceError: string | null

  // Attendance management
  attendances: MergedAttendanceData[]
  updateAttendance: (attendance: PracticeAttendanceData) => void
  getAttendance: (dogId: string) => AttendanceStatus | undefined

  // Sets management
  sets: SetData[]
  addSet: (set: Partial<SetData>) => void
  updateSet: (setId: string, updates: Partial<SetData>) => void
  removeSet: (setId: string) => void

  // Utility functions
  refreshPractice: () => void
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined)

interface PracticeProviderProps {
  children: React.ReactNode
  practiceId?: string
}

// Helper function to sort sets by index
const sortSetsByIndex = (sets: SetData[]): SetData[] => {
  return [...sets].sort((a, b) => a.index - b.index)
}

// Sets reducer for race-condition-free updates
type SetAction =
  | { type: 'SET_SETS'; sets: SetData[] }
  | { type: 'ADD_SET'; set: SetData }
  | { type: 'UPDATE_SET'; setId: string; updates: Partial<SetData> }
  | { type: 'REMOVE_SET'; setId: string }

function setsReducer(state: SetData[], action: SetAction): SetData[] {
  switch (action.type) {
    case 'SET_SETS':
      return sortSetsByIndex(action.sets)
    case 'ADD_SET':
      return sortSetsByIndex([...state, action.set])
    case 'UPDATE_SET':
      return sortSetsByIndex(
        state.map(s => s.id === action.setId ? { ...s, ...action.updates, updatedAt: new Date().toISOString() } : s)
      )
    case 'REMOVE_SET':
      const filtered = state.filter(s => s.id !== action.setId)
      return sortSetsByIndex(filtered)
    default:
      return state
  }
}

export function PracticeProvider({ children, practiceId }: PracticeProviderProps) {
  const [practice, setPractice] = useState<PracticeData | null>(null)
  const [isPracticeLoading, setIsPracticeLoading] = useState(false)
  const [practiceError, setPracticeError] = useState<string | null>(null)

  const [sets, dispatchSets] = useReducer(setsReducer, [])
  const { dogs } = useClub()

  // Load practice data
  const { data: practiceData, loading: practiceQueryLoading, error: practiceQueryError, refetch } = useQuery<GetPracticeQuery>(GetPractice, {
    variables: { id: practiceId! },
    skip: !practiceId,
    onError: (err) => {
      setPracticeError('Failed to load practice details. Please try again later.')
      console.error('Error loading practice:', err)
    }
  })

  // Update loading states
  useEffect(() => {
    setIsPracticeLoading(practiceQueryLoading)
  }, [practiceQueryLoading])

  useEffect(() => {
    if (practiceQueryError) {
      setPracticeError(practiceQueryError.message)
    } else {
      setPracticeError(null)
    }
  }, [practiceQueryError])

  // Update practice data when query returns
  useEffect(() => {
    if (practiceData?.practice) {
      const practiceWithSortedSets = {
        ...practiceData.practice,
        sets: sortSetsByIndex(practiceData.practice.sets)
      }
      setPractice(practiceWithSortedSets)
      // Always update sets when practice data changes
      dispatchSets({ type: 'SET_SETS', sets: practiceData.practice.sets })
    }
  }, [practiceData])

  // Merge attendance data with active dogs
  const mergedAttendances = useMemo(() => {
    if (!practice || !practiceId) return []

    const existingAttendances = practice.attendances || []
    const activeDogs = dogs.filter(dog => dog.status === 'Active')

    // Create a map of existing attendance records by dogId
    const attendanceMap = new Map<string, PracticeAttendanceData>()
    existingAttendances.forEach(attendance => {
      attendanceMap.set(attendance.dogId, attendance)
    })

    // Create merged attendance list
    const merged: MergedAttendanceData[] = []

    // Add existing attendance records
    existingAttendances.forEach(attendance => {
      merged.push(attendance)
    })

    // Add virtual attendance records for active dogs without attendance records
    activeDogs.forEach(dog => {
      if (!attendanceMap.has(dog.id)) {
        const virtualAttendance: VirtualAttendanceData = {
          id: dog.id, // Use dogId as virtual ID
          dogId: dog.id,
          attending: AttendanceStatus.Unknown,
          practiceId: practiceId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isVirtual: true,
          dog: dog
        }
        merged.push(virtualAttendance)
      }
    })

    return merged
  }, [practice, practiceId, dogs])

  // Subscribe to practice changes (basic fields only)
  useSubscription<PracticeChangedSubscription>(PRACTICE_CHANGED_SUBSCRIPTION, {
    variables: { practiceId },
    skip: !practiceId,
    onData: ({ data }) => {
      if (data?.data?.practiceChanged) {
        const { practice: updatedPractice } = data.data.practiceChanged
        if (updatedPractice.id === practiceId) {
          setPractice(prev => {
            if (!prev) return prev
            return {
              ...prev,
              scheduledAt: updatedPractice.scheduledAt,
              status: updatedPractice.status,
              updatedAt: updatedPractice.updatedAt
            }
          })
        }
      }
    },
    onError: (error) => {
      console.error('Practice subscription error:', error)
    }
  })

  // Subscribe to attendance changes
  useSubscription<PracticeAttendanceChangedSubscription>(PRACTICE_ATTENDANCE_CHANGED_SUBSCRIPTION, {
    variables: { practiceId },
    skip: !practiceId,
    onData: ({ data }) => {
      if (data?.data?.practiceAttendanceChanged) {
        const { attendance: updatedAttendance } = data.data.practiceAttendanceChanged
        if (updatedAttendance.practiceId === practiceId) {
          updateAttendance(updatedAttendance)
        }
      }
    },
    onError: (error) => {
      console.error('Practice attendance subscription error:', error)
    }
  })

  useSubscription<PracticeSetChangedSubscription>(PRACTICE_SET_CHANGED_SUBSCRIPTION, {
    variables: { practiceId },
    skip: !practiceId,
    onData: ({ data }) => {
      if (data?.data?.practiceSetChanged) {
        const { set: updatedSet, eventType } = data.data.practiceSetChanged

        if (updatedSet.practiceId === practiceId) {
          switch (eventType) {
            case 'UPDATED':
              const existingSet = sets.find(s => s.id === updatedSet.id)
              if (existingSet) {
                dispatchSets({ type: 'UPDATE_SET', setId: updatedSet.id, updates: updatedSet as any })
              } else {
                dispatchSets({ type: 'ADD_SET', set: updatedSet as any })
              }
              break

            case 'DELETED':
              dispatchSets({ type: 'REMOVE_SET', setId: updatedSet.id })
              break
          }
        }
      }
    },
    onError: (error) => {
      console.error('Practice set subscription error:', error)
    }
  })

  const refreshPractice = useCallback(() => {
    if (practiceId) {
      refetch()
    }
  }, [practiceId, refetch])

  // Attendance management
  const updateAttendance = useCallback((attendance: PracticeAttendanceData) => {
    setPractice(prev => {
      if (!prev) return prev

      const existingAttendanceIndex = prev.attendances.findIndex(a => a.dogId === attendance.dogId)

      let updatedAttendances
      if (existingAttendanceIndex >= 0) {
        updatedAttendances = prev.attendances.map(a =>
          a.dogId === attendance.dogId ? attendance : a
        )
      } else {
        updatedAttendances = [...prev.attendances, attendance]
      }

      return {
        ...prev,
        attendances: updatedAttendances
      }
    })
  }, [])

  const getAttendance = useCallback((dogId: string) => {
    const attendance = mergedAttendances.find(a => a.dogId === dogId)
    return attendance?.attending
  }, [mergedAttendances])

  // Sets management - now using reducer
  const addSet = useCallback((set: Partial<SetData>) => {
    dispatchSets({ type: 'ADD_SET', set: set as SetData })
  }, [])

  const updateSet = useCallback((setId: string, updates: Partial<SetData>) => {
    dispatchSets({ type: 'UPDATE_SET', setId, updates })
  }, [])

  const removeSet = useCallback((setId: string) => {
    dispatchSets({ type: 'REMOVE_SET', setId })
  }, [])

  return (
    <PracticeContext.Provider value={{
      practice,
      isPracticeLoading,
      practiceError,
      attendances: mergedAttendances,
      updateAttendance,
      getAttendance,
      sets: sets,
      addSet,
      updateSet,
      removeSet,
      refreshPractice
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
