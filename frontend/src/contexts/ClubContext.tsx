import { createContext, useContext, useState, type ReactNode } from 'react'

interface ClubContextType {
  selectedClubId: string
  setSelectedClubId: (clubId: string) => void
}

const ClubContext = createContext<ClubContextType | undefined>(undefined)

export function ClubProvider({ children }: { children: ReactNode }) {
  const [selectedClubId, setSelectedClubId] = useState<string>('')

  return (
    <ClubContext.Provider value={{ selectedClubId, setSelectedClubId }}>
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
