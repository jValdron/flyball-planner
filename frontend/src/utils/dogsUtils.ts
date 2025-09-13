import type { GetDogsByHandlersInClub } from "../graphql/dogs"
import type { DocumentType } from '../graphql/generated/gql'

export type HandlerWithDogs = NonNullable<DocumentType<typeof GetDogsByHandlersInClub>['dogsByHandlersInClub']>[number]
export type DogWithBasicInfo = NonNullable<HandlerWithDogs['dogs']>[number]

export const getFilteredAndSortedDogsByHandlers = (dogsByHandlers: HandlerWithDogs[], searchQuery: string | null = null, showInactive: boolean = false) => {
  if (!dogsByHandlers) return []

  if (!searchQuery) {
    return dogsByHandlers
      .map((handler: HandlerWithDogs) => ({
        ...handler,
        dogs: handler.dogs?.filter((dog: DogWithBasicInfo) => {
          return showInactive || dog.status === 'Active'
        }).sort((a: DogWithBasicInfo, b: DogWithBasicInfo) => a.name.localeCompare(b.name)) || []
      }))
      .filter((handler: HandlerWithDogs) => {
        return showInactive || (handler.dogs?.length || 0) > 0
      })
      .sort((a: HandlerWithDogs, b: HandlerWithDogs) => getHandlerName(a).localeCompare(getHandlerName(b)))
  }

  const searchLower = searchQuery.toLowerCase()
  const filteredDogsByHandlers = dogsByHandlers
    .filter((handler: HandlerWithDogs) => {
      const handlerName = getHandlerName(handler).toLowerCase()

      if (searchLower && handlerName.includes(searchLower)) {
        return true
      }

      return (!searchLower && !handler.dogs?.length) || handler.dogs?.some((dog: DogWithBasicInfo) => {
        const matchesInactive = showInactive || dog.status === 'Active'
        const matchesSearch = searchQuery === '' ||
          dog.name.toLowerCase().includes(searchLower) ||
          (dog.crn?.toLowerCase() || '').includes(searchLower)
        return matchesInactive && matchesSearch
      })
    })
    .map((handler: HandlerWithDogs) => ({
      ...handler,
      dogs: handler.dogs?.filter((dog: DogWithBasicInfo) => {
        const handlerName = getHandlerName(handler).toLowerCase()
        const matchesHandler = searchLower && handlerName.includes(searchLower)
        const matchesInactive = showInactive || dog.status === 'Active'
        const matchesSearch = searchQuery === '' ||
          dog.name.toLowerCase().includes(searchLower) ||
          (dog.crn?.toLowerCase() || '').includes(searchLower)
        return (matchesHandler && matchesInactive) || matchesInactive && matchesSearch
      }).sort((a: DogWithBasicInfo, b: DogWithBasicInfo) => a.name.localeCompare(b.name)) || []
    }))
    .filter((handler: HandlerWithDogs) => {
      return showInactive || (handler.dogs?.length || 0) > 0
    })
    .sort((a: HandlerWithDogs, b: HandlerWithDogs) => getHandlerName(a).localeCompare(getHandlerName(b)))

  return filteredDogsByHandlers
}

export const getHandlerName = (handler: HandlerWithDogs) => {
  return `${handler.givenName} ${handler.surname}`
}
