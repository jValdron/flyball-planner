import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
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
  attendances: PracticeAttendanceData[]
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

export function PracticeProvider({ children, practiceId }: PracticeProviderProps) {
  const [practice, setPractice] = useState<PracticeData | null>(null)
  const [isPracticeLoading, setIsPracticeLoading] = useState(false)
  const [practiceError, setPracticeError] = useState<string | null>(null)

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
    }
  }, [practiceData])

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
      console.log('practice attendance changed', data)
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
              const existingSet = practice?.sets.find(s => s.id === updatedSet.id)
              if (existingSet) {
                updateSet(updatedSet.id, updatedSet)
              } else {
                addSet(updatedSet as SetData)
              }
              break

            case 'DELETED':
              removeSet(updatedSet.id)
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
    return practice?.attendances.find(a => a.dogId === dogId)?.attending
  }, [practice])

  // Sets management
  const addSet = useCallback((set: Partial<SetData>) => {
    if (!practice) return

    setPractice(prev => {
      if (!prev) return prev

      const newSets = [...prev.sets, set as SetData]
      return {
        ...prev,
        sets: sortSetsByIndex(newSets)
      }
    })
  }, [practice])

  const updateSet = useCallback((setId: string, updates: Partial<SetData>) => {
    if (!practice) return

    setPractice(prev => {
      if (!prev) return prev

      const updatedSets = prev.sets.map(s =>
        s.id === setId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      )

      return {
        ...prev,
        sets: sortSetsByIndex(updatedSets)
      }
    })
  }, [practice])

  const removeSet = useCallback((setId: string) => {
    if (!practice) return

    setPractice(prev => {
      if (!prev) return prev

      const filteredSets = prev.sets.filter(s => s.id !== setId)
      return {
        ...prev,
        sets: sortSetsByIndex(filteredSets)
      }
    })
  }, [practice])

  return (
    <PracticeContext.Provider value={{
      practice,
      isPracticeLoading,
      practiceError,
      attendances: practice?.attendances || [],
      updateAttendance,
      getAttendance,
      sets: sortSetsByIndex(practice?.sets || []),
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
