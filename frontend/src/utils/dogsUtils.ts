import type { Handler, Dog } from '../graphql/generated/graphql'

export const getFilteredAndSortedDogsByHandlers = (dogsByHandlers: Handler[], searchQuery: string | null = null, showInactive: boolean = false) => {
  if (!dogsByHandlers) return []

  if (!searchQuery) {
    return dogsByHandlers
      .map((handler: Handler) => ({
        ...handler,
        dogs: handler.dogs?.filter((dog: Dog) => {
          return showInactive || dog.status === 'Active'
        }).sort((a: Dog, b: Dog) => a.name.localeCompare(b.name)) || []
      }))
      .filter((handler: Handler) => {
        return showInactive || (handler.dogs?.length || 0) > 0
      })
      .sort((a: Handler, b: Handler) => getHandlerName(a).localeCompare(getHandlerName(b)))
  }

  const searchLower = searchQuery.toLowerCase()
  const filteredDogsByHandlers = dogsByHandlers
    .filter((handler: Handler) => {
      const handlerName = getHandlerName(handler).toLowerCase()

      if (searchLower && handlerName.includes(searchLower)) {
        return true
      }

      return (!searchLower && !handler.dogs?.length) || handler.dogs?.some((dog: Dog) => {
        const matchesInactive = showInactive || dog.status === 'Active'
        const matchesSearch = searchQuery === '' ||
          dog.name.toLowerCase().includes(searchLower) ||
          (dog.crn?.toLowerCase() || '').includes(searchLower)
        return matchesInactive && matchesSearch
      })
    })
    .map((handler: Handler) => ({
      ...handler,
      dogs: handler.dogs?.filter((dog: Dog) => {
        const handlerName = getHandlerName(handler).toLowerCase()
        const matchesHandler = searchLower && handlerName.includes(searchLower)
        const matchesInactive = showInactive || dog.status === 'Active'
        const matchesSearch = searchQuery === '' ||
          dog.name.toLowerCase().includes(searchLower) ||
          (dog.crn?.toLowerCase() || '').includes(searchLower)
        return (matchesHandler && matchesInactive) || matchesInactive && matchesSearch
      }).sort((a: Dog, b: Dog) => a.name.localeCompare(b.name)) || []
    }))
    .filter((handler: Handler) => {
      return showInactive || (handler.dogs?.length || 0) > 0
    })
    .sort((a: Handler, b: Handler) => getHandlerName(a).localeCompare(getHandlerName(b)))

  return filteredDogsByHandlers
}

export const getHandlerName = (handler: Handler) => {
  return `${handler.givenName} ${handler.surname}`
}

// Generic function to enrich objects with dog data from known club context
export function enrichDogs<T>(obj: T, dogs: Dog[]): T {
  if (Array.isArray(obj)) {
    return obj.map(item => enrichDogs(item, dogs)) as T
  }

  if (obj && typeof obj === 'object' && obj !== null) {
    const enriched = { ...obj } as Record<string, unknown>

    if ('dogId' in obj && typeof (obj as Record<string, unknown>).dogId === 'string') {
      enriched.dog = dogs.find(d => d.id === (obj as Record<string, unknown>).dogId)
    }

    Object.keys(enriched).forEach(key => {
      const value = enriched[key]
      if (value && typeof value === 'object') {
        enriched[key] = enrichDogs(value, dogs)
      }
    })

    return enriched as T
  }

  return obj
}
