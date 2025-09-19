import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

import { useQuery } from '@apollo/client'

import type { Club, Dog, Handler, Location } from '../graphql/generated/graphql'
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
  dogsByHandlersInSelectedClub: Handler[]
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

      const allDogs = handlersList.flatMap((handler: Handler) => handler?.dogs?.map((dog: Dog) => {
        return {
          ...dog,
          ownerId: handler.id
        }
      }) || [])
      setDogs(allDogs)
    }
  }, [handlersData])

  useEffect(() => {
    if (locationsData?.locationsByClub) {
      setLocations(locationsData.locationsByClub as Location[])
    }
  }, [locationsData])

  // Subscribe to real-time updates only when a club is selected
  const { data: clubSubscriptionData, error: clubSubError } = useClubChangedSubscription({
    skip: !selectedClub?.id,
    onError: (error) => {
      console.error('Club subscription error:', error);
    }
  })

  const { data: dogSubscriptionData, error: dogSubError } = useDogChangedSubscription(
    selectedClub?.id,
    {
      skip: !selectedClub?.id,
      onError: (error) => {
        console.error('Dog subscription error:', error);
      }
    }
  )

  const { data: handlerSubscriptionData, error: handlerSubError } = useHandlerChangedSubscription(
    selectedClub?.id,
    {
      skip: !selectedClub?.id,
      onError: (error) => {
        console.error('Handler subscription error:', error);
      }
    }
  )

  const { data: locationSubscriptionData, error: locationSubError } = useLocationChangedSubscription(
    selectedClub?.id,
    {
      skip: !selectedClub?.id,
      onError: (error) => {
        console.error('Location subscription error:', error);
      }
    }
  )

  // Handle subscription updates
  useEffect(() => {
    if (clubSubscriptionData?.clubChanged) {
      const { club: updatedClub, eventType } = clubSubscriptionData.clubChanged

      if (updatedClub.id === selectedClub?.id) {
        switch (eventType) {
          case 'CREATED':
            break

          case 'UPDATED':
            setSelectedClub(updatedClub as Club)
            break

          case 'DELETED':
            setSelectedClub(null)
            break

          default:
            break
        }
      }
    }
  }, [clubSubscriptionData, selectedClub?.id])

  useEffect(() => {
    if (dogSubscriptionData?.dogChanged) {
      const { dog: updatedDog, eventType } = dogSubscriptionData.dogChanged

      setDogs(prevDogs => {
        const existingIndex = prevDogs.findIndex(dog => dog.id === updatedDog.id)

        switch (eventType) {
          case 'CREATED':
            if (existingIndex === -1) {
              return [...prevDogs, updatedDog as Dog]
            }
            return prevDogs

          case 'UPDATED':
            if (existingIndex >= 0) {
              const newDogs = [...prevDogs]
              newDogs[existingIndex] = updatedDog as Dog
              return newDogs
            } else {
              return [...prevDogs, updatedDog as Dog]
            }

          case 'DELETED':
            if (existingIndex >= 0) {
              return prevDogs.filter(dog => dog.id !== updatedDog.id)
            }
            return prevDogs

          default:
            return prevDogs
        }
      })
    }
  }, [dogSubscriptionData])

  useEffect(() => {
    if (handlerSubscriptionData?.handlerChanged) {
      const { handler: updatedHandler, eventType } = handlerSubscriptionData.handlerChanged

      setHandlers(prevHandlers => {
        const existingIndex = prevHandlers.findIndex(handler => handler.id === updatedHandler.id)

        switch (eventType) {
          case 'CREATED':
            if (existingIndex === -1) {
              return [...prevHandlers, updatedHandler as Handler]
            }
            return prevHandlers

          case 'UPDATED':
            if (existingIndex >= 0) {
              const newHandlers = [...prevHandlers]
              newHandlers[existingIndex] = updatedHandler as Handler
              return newHandlers
            } else {
              return [...prevHandlers, updatedHandler as Handler]
            }

          case 'DELETED':
            if (existingIndex >= 0) {
              return prevHandlers.filter(handler => handler.id !== updatedHandler.id)
            }
            return prevHandlers

          default:
            return prevHandlers
        }
      })
    }
  }, [handlerSubscriptionData])

  useEffect(() => {
    if (locationSubscriptionData?.locationChanged) {
      const { location: updatedLocation, eventType } = locationSubscriptionData.locationChanged

      setLocations(prevLocations => {
        const existingIndex = prevLocations.findIndex(location => location.id === updatedLocation.id)

        switch (eventType) {
          case 'CREATED':
            if (existingIndex === -1) {
              return [...prevLocations, updatedLocation as Location]
            }
            return prevLocations

          case 'UPDATED':
            if (existingIndex >= 0) {
              const newLocations = [...prevLocations]
              newLocations[existingIndex] = updatedLocation as Location
              return newLocations
            } else {
              return [...prevLocations, updatedLocation as Location]
            }

          case 'DELETED':
            if (existingIndex >= 0) {
              return prevLocations.filter(location => location.id !== updatedLocation.id)
            }
            return prevLocations

          default:
            return prevLocations
        }
      })
    }
  }, [locationSubscriptionData])

  const dogsByHandlersInSelectedClub = useMemo(() => {
    if (!selectedClub?.id || !handlers.length || !dogs.length) {
      return []
    }

    return handlers.map((handler: Handler) => ({
      ...handler,
      dogs: dogs.filter(dog => dog?.ownerId === handler.id)
    }))
  }, [selectedClub?.id, handlers, dogs])

  const loading = clubLoading || handlersLoading || locationsLoading
  const hasError = clubError || handlersError || locationsError || clubSubError || dogSubError || handlerSubError || locationSubError

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
      dogsByHandlersInSelectedClub,
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
