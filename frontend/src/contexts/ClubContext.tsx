import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Club, Dog, Handler, Location } from '../graphql/generated/graphql'
import { useQuery } from '@apollo/client'
import { GetClubById, GetLocationsByClub } from '../graphql/clubs'
import { GetDogsByHandlersInClub } from '../graphql/dogs'
import {
  useClubChangedSubscription,
  useDogChangedSubscription,
  useHandlerChangedSubscription,
  useLocationChangedSubscription,
} from '../hooks/useSubscription'

interface ClubContextType {
  selectedClub: Club | null
  setSelectedClub: (club: Club | null) => void
  dogs: Dog[]
  handlers: Handler[]
  locations: Location[]
  loading: boolean
  error: string | null
}

const ClubContext = createContext<ClubContextType | undefined>(undefined)

export function ClubProvider({ children }: { children: ReactNode }) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [handlers, setHandlers] = useState<Handler[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [error, setError] = useState<string | null>(null)

  // Fetch initial club data
  const { data: clubData, loading: clubLoading, error: clubError } = useQuery(GetClubById, {
    variables: { id: selectedClub?.id || '' },
    skip: !selectedClub?.id,
    onError: (error) => {
      setError('Failed to load club data')
      console.error('Error loading club:', error)
    }
  })

  // Fetch handlers with dogs
  const { data: handlersData, loading: handlersLoading, error: handlersError } = useQuery(GetDogsByHandlersInClub, {
    variables: { clubId: selectedClub?.id || '' },
    skip: !selectedClub?.id,
    onError: (error) => {
      setError('Failed to load handlers and dogs')
      console.error('Error loading handlers:', error)
    }
  })

  // Fetch locations
  const { data: locationsData, loading: locationsLoading, error: locationsError } = useQuery(GetLocationsByClub, {
    variables: { clubId: selectedClub?.id || '' },
    skip: !selectedClub?.id,
    onError: (error) => {
      setError('Failed to load locations')
      console.error('Error loading locations:', error)
    }
  })

  // Update local state when data changes
  useEffect(() => {
    if (clubData?.club) {
      setSelectedClub(clubData.club as Club)
    }
  }, [clubData])

  useEffect(() => {
    if (handlersData?.dogsByHandlersInClub) {
      const handlersList = handlersData.dogsByHandlersInClub as Handler[]
      setHandlers(handlersList)
      // Extract dogs from handlers
      const allDogs = handlersList.flatMap((handler: Handler) => handler.dogs)
      setDogs(allDogs)
    }
  }, [handlersData])

  useEffect(() => {
    if (locationsData?.locationsByClub) {
      setLocations(locationsData.locationsByClub as Location[])
    }
  }, [locationsData])

  // Subscribe to real-time updates
  const { data: clubSubscriptionData, error: clubSubError } = useClubChangedSubscription({
    onError: (error) => {
      console.error('Club subscription error:', error)
    }
  })

  const { data: dogSubscriptionData, error: dogSubError } = useDogChangedSubscription(selectedClub?.id, {
    skip: !selectedClub?.id,
    onError: (error) => {
      console.error('Dog subscription error:', error)
    }
  })

  const { data: handlerSubscriptionData, error: handlerSubError } = useHandlerChangedSubscription(selectedClub?.id, {
    skip: !selectedClub?.id,
    onError: (error) => {
      console.error('Handler subscription error:', error)
    }
  })

  const { data: locationSubscriptionData, error: locationSubError } = useLocationChangedSubscription(selectedClub?.id, {
    skip: !selectedClub?.id,
    onError: (error) => {
      console.error('Location subscription error:', error)
    }
  })

  // Debug subscription errors
  useEffect(() => {
    console.log('ClubContext: selectedClub changed to:', selectedClub?.id)
  }, [selectedClub?.id])

  useEffect(() => {
    if (clubSubError) {
      console.error('Club subscription error in context:', clubSubError)
    }
    if (dogSubError) {
      console.error('Dog subscription error in context:', dogSubError)
    }
    if (handlerSubError) {
      console.error('Handler subscription error in context:', handlerSubError)
    }
    if (locationSubError) {
      console.error('Location subscription error in context:', locationSubError)
    }
  }, [clubSubError, dogSubError, handlerSubError, locationSubError])

  // Handle subscription updates
  useEffect(() => {
    if (clubSubscriptionData?.clubChanged) {
      const updatedClub = clubSubscriptionData.clubChanged.club as Club
      if (updatedClub.id === selectedClub?.id) {
        setSelectedClub(updatedClub)
      }
    }
  }, [clubSubscriptionData, selectedClub?.id])

  useEffect(() => {
    if (dogSubscriptionData?.dogChanged) {
      const updatedDog = dogSubscriptionData.dogChanged.dog as Dog
      setDogs(prevDogs => {
        const existingIndex = prevDogs.findIndex(dog => dog.id === updatedDog.id)
        if (existingIndex >= 0) {
          // Update existing dog
          const newDogs = [...prevDogs]
          newDogs[existingIndex] = updatedDog
          return newDogs
        } else {
          // Add new dog
          return [...prevDogs, updatedDog]
        }
      })
    }
  }, [dogSubscriptionData])

  useEffect(() => {
    if (handlerSubscriptionData?.handlerChanged) {
      const updatedHandler = handlerSubscriptionData.handlerChanged.handler as Handler
      setHandlers(prevHandlers => {
        const existingIndex = prevHandlers.findIndex(handler => handler.id === updatedHandler.id)
        if (existingIndex >= 0) {
          // Update existing handler
          const newHandlers = [...prevHandlers]
          newHandlers[existingIndex] = updatedHandler
          return newHandlers
        } else {
          // Add new handler
          return [...prevHandlers, updatedHandler]
        }
      })
    }
  }, [handlerSubscriptionData])

  useEffect(() => {
    if (locationSubscriptionData?.locationChanged) {
      const updatedLocation = locationSubscriptionData.locationChanged.location as Location
      setLocations(prevLocations => {
        const existingIndex = prevLocations.findIndex(location => location.id === updatedLocation.id)
        if (existingIndex >= 0) {
          // Update existing location
          const newLocations = [...prevLocations]
          newLocations[existingIndex] = updatedLocation
          return newLocations
        } else {
          // Add new location
          return [...prevLocations, updatedLocation]
        }
      })
    }
  }, [locationSubscriptionData])

  const loading = clubLoading || handlersLoading || locationsLoading
  const hasError = clubError || handlersError || locationsError

  useEffect(() => {
    if (hasError) {
      setError('Failed to load club data')
    } else {
      setError(null)
    }
  }, [hasError])

  return (
    <ClubContext.Provider value={{
      selectedClub,
      setSelectedClub,
      dogs,
      handlers,
      locations,
      loading,
      error
    }}>
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
