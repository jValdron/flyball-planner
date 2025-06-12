import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Club } from '../graphql/generated/graphql'

interface ClubContextType {
  selectedClub: Partial<Club> | null
  setSelectedClub: (club: Partial<Club> | null) => void
}

const ClubContext = createContext<ClubContextType | undefined>(undefined)

export function ClubProvider({ children }: { children: ReactNode }) {
  const [selectedClub, setSelectedClub] = useState<Partial<Club> | null>(null)

  return (
    <ClubContext.Provider value={{ selectedClub, setSelectedClub }}>
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
