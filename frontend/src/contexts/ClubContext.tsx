import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface Club {
  ID: string
  Name: string
  NAFAClubNumber: string
  DefaultPracticeTime: string
  CreatedAt: string
  UpdatedAt: string
}

interface ClubContextType {
  selectedClubId: string | null
  setSelectedClubId: (id: string) => void
  selectedClub: Club | null
  setSelectedClub: (club: Club | null) => void
}

const ClubContext = createContext<ClubContextType | undefined>(undefined)

export function ClubProvider({ children }: { children: ReactNode }) {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)

  return (
    <ClubContext.Provider value={{ selectedClubId, setSelectedClubId, selectedClub, setSelectedClub }}>
      {children}
    </ClubContext.Provider>
  )
}

export function useClub() {
  const context = useContext(ClubContext)
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider')
  }
  return context
}
