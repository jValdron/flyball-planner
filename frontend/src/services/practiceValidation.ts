import type { Dog, Practice, Handler } from '../graphql/generated/graphql'
import { AttendanceStatus, DogStatus } from '../graphql/generated/graphql'
import * as React from 'react'
import { ListOl, QuestionLg, ExclamationTriangle, People, Clock } from 'react-bootstrap-icons'
import type { ExtendedAttendanceData } from '../types/attendance'

export type ValidationSeverity = 'info' | 'warning' | 'error'

export interface ValidationError {
  code: string
  message: string
  severity: ValidationSeverity
  count?: number
  icon?: React.ReactNode
  extra?: any
  setId?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationContext {
  dogs: Dog[]
  handlers: Handler[]
}

export type ValidationRule<T> = (data: T, context?: ValidationContext) => ValidationError | null

const IDEAL_SETS_PER_DOG = 2

export class Validator<T> {
  private rules: ValidationRule<T>[]

  constructor(rules: ValidationRule<T>[]) {
    this.rules = rules
  }

  validate(data: T, context?: ValidationContext): ValidationResult {
    const errors: ValidationError[] = []
    for (const rule of this.rules) {
      const error = rule(data, context)
      if (error) {
        errors.push(error)
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// --- Rules ---

export const unconfirmedAttendanceRule: ValidationRule<Partial<Practice>> = (practice) => {
  const attendances = practice.attendances as ExtendedAttendanceData[] || []
  const unconfirmedAttendances = attendances.filter(
    attendance => attendance.attending === AttendanceStatus.Unknown
  )
  if (unconfirmedAttendances.length > 0) {
    return {
      code: 'UNCONFIRMED_ATTENDANCES',
      message: 'Dogs with unconfirmed attendance',
      severity: 'info',
      count: unconfirmedAttendances.length,
      icon: React.createElement(QuestionLg),
      extra: { unconfirmedAttendances },
    }
  }
  return null
}

export const timingRule: ValidationRule<Partial<Practice>> = (practice) => {
  if (!practice.scheduledAt) return null
  const practiceDate = new Date(practice.scheduledAt)
  const now = new Date()
  if (practiceDate < now) {
    return {
      code: 'PAST_PRACTICE',
      message: 'Practice has already happened, you cannot edit it anymore',
      severity: 'error',
    }
  }
  const threeMonthsFromNow = new Date()
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
  if (practiceDate > threeMonthsFromNow) {
    return {
      code: 'FUTURE_PRACTICE',
      message: 'Practice is scheduled more than 3 months in advance',
      severity: 'warning',
    }
  }
  return null
}

export const setConfigurationRule: ValidationRule<Partial<Practice>> = (practice) => {
  const attendances = practice.attendances as ExtendedAttendanceData[] || []
  const confirmedAttendances = attendances.filter(
    attendance => attendance.attending === AttendanceStatus.Attending
  )
  if (confirmedAttendances.length < 4) {
    return {
      code: 'INSUFFICIENT_DOGS',
      message: `Not enough dogs confirmed for practice (${confirmedAttendances.length}/4 minimum)`,
      severity: 'error',
      icon: React.createElement(ListOl),
    }
  }
  if (!practice.sets || practice.sets.length === 0) {
    return {
      code: 'NO_SETS_CONFIGURED',
      message: 'No sets have been configured for confirmed dogs',
      severity: 'error',
      icon: React.createElement(ListOl),
    }
  }
  return null
}

export const setAttendanceRule: ValidationRule<Partial<Practice>> = (practice) => {
  const attendances = practice.attendances as ExtendedAttendanceData[] || []
  const sets = practice.sets || []
  const confirmedDogIds = new Set(
    attendances
      .filter(attendance => attendance.attending === AttendanceStatus.Attending)
      .map(attendance => attendance.dogId)
  )
  const unconfirmedSetAttendances: { dogId: string, dog?: Dog, setIndex: number }[] = []
  sets.forEach(set => {
    set.dogs?.forEach(setDog => {
      if (!confirmedDogIds.has(setDog.dogId)) {
        const attendance = attendances.find(a => a.dogId === setDog.dogId)
        unconfirmedSetAttendances.push({
          dogId: setDog.dogId,
          dog: attendance?.dog,
          setIndex: set.index,
        })
      }
    })
  })
  if (unconfirmedSetAttendances.length > 0) {
    return {
      code: 'UNCONFIRMED_SET_ATTENDANCES',
      message: 'Dogs in sets but not confirmed for attendance',
      severity: 'warning',
      count: unconfirmedSetAttendances.length,
      icon: React.createElement(ExclamationTriangle),
      extra: { unconfirmedSetAttendances },
    }
  }
  return null
}

export const sameHandlerInSetRule: ValidationRule<Partial<Practice>> = (practice, context) => {
  if (!context?.dogs || !context?.handlers) return null

  const sets = practice.sets || []
  const conflicts: { handlerId: string, handlerName: string, setIndex: number, setId: string, dogNames: string[], dogIds: string[] }[] = []

  sets.forEach(set => {
    const handlerDogMap = new Map<string, { handlerName: string, dogNames: string[], dogIds: string[] }>()

    set.dogs?.forEach(setDog => {
      const dog = context.dogs.find(d => d.id === setDog.dogId)
      if (dog?.ownerId) {
        const handlerId = dog.ownerId
        const handler = context.handlers.find(h => h.id === handlerId)
        const handlerName = handler ?
          `${handler.givenName} ${handler.surname}` :
          'Unknown Handler'

        if (handlerDogMap.has(handlerId)) {
          handlerDogMap.get(handlerId)!.dogNames.push(dog.name)
          handlerDogMap.get(handlerId)!.dogIds.push(dog.id)
        } else {
          handlerDogMap.set(handlerId, { handlerName, dogNames: [dog.name], dogIds: [dog.id] })
        }
      }
    })

    handlerDogMap.forEach((handlerInfo, handlerId) => {
      if (handlerInfo.dogNames.length > 1) {
        conflicts.push({
          handlerId,
          handlerName: handlerInfo.handlerName,
          setIndex: set.index,
          setId: set.id,
          dogNames: handlerInfo.dogNames,
          dogIds: handlerInfo.dogIds
        })
      }
    })
  })

  if (conflicts.length > 0) {
    return {
      code: 'SAME_HANDLER_IN_SET',
      message: 'Multiple dogs from same handler in same set',
      severity: 'warning',
      count: conflicts.length,
      icon: React.createElement(People),
      extra: { conflicts },
    }
  }
  return null
}

export const backToBackHandlerRule: ValidationRule<Partial<Practice>> = (practice, context) => {
  if (!context?.dogs || !context?.handlers) return null

  const sets = practice.sets || []
  const backToBackHandlers: { handlerId: string, handlerName: string, setIndices: number[], dogIds: string[] }[] = []

  const setsByIndex = new Map<number, typeof sets>()
  sets.forEach(set => {
    if (!setsByIndex.has(set.index)) {
      setsByIndex.set(set.index, [])
    }
    setsByIndex.get(set.index)!.push(set)
  })

  const handlerSetMap = new Map<string, { handlerName: string, setIndices: number[], dogIds: string[] }>()

  const sortedIndices = Array.from(setsByIndex.keys()).sort((a, b) => a - b)

  sortedIndices.forEach(setIndex => {
    const currentSets = setsByIndex.get(setIndex) || []
    const currentHandlerIds = new Set<string>()

    currentSets.forEach(set => {
      set.dogs?.forEach(setDog => {
        const dog = context.dogs.find(d => d.id === setDog.dogId)
        if (dog?.ownerId) {
          currentHandlerIds.add(dog.ownerId)
        }
      })
    })

    currentHandlerIds.forEach(handlerId => {
      const handler = context.handlers.find(h => h.id === handlerId)
      const handlerName = handler ?
        `${handler.givenName} ${handler.surname}` :
        'Unknown Handler'

      if (handlerSetMap.has(handlerId)) {
        const existing = handlerSetMap.get(handlerId)!
        const lastSetIndex = existing.setIndices[existing.setIndices.length - 1]
        if (setIndex === lastSetIndex + 1) {
          existing.setIndices.push(setIndex)
        } else {
          // Get all dog IDs for this handler
          const handlerDogIds: string[] = []
          sets.forEach(set => {
            set.dogs?.forEach(setDog => {
              const dog = context.dogs.find(d => d.id === setDog.dogId)
              if (dog?.ownerId === handlerId) {
                handlerDogIds.push(dog.id)
              }
            })
          })
          handlerSetMap.set(handlerId, {
            handlerName,
            setIndices: [setIndex],
            dogIds: handlerDogIds
          })
        }
      } else {
        // Get all dog IDs for this handler
        const handlerDogIds: string[] = []
        sets.forEach(set => {
          set.dogs?.forEach(setDog => {
            const dog = context.dogs.find(d => d.id === setDog.dogId)
            if (dog?.ownerId === handlerId) {
              handlerDogIds.push(dog.id)
            }
          })
        })
        handlerSetMap.set(handlerId, {
          handlerName,
          setIndices: [setIndex],
          dogIds: handlerDogIds
        })
      }
    })
  })

  handlerSetMap.forEach((handlerInfo, handlerId) => {
    if (handlerInfo.setIndices.length > 1) {
      backToBackHandlers.push({
        handlerId,
        handlerName: handlerInfo.handlerName,
        setIndices: handlerInfo.setIndices,
        dogIds: handlerInfo.dogIds
      })
    }
  })

  if (backToBackHandlers.length > 0) {
    return {
      code: 'BACK_TO_BACK_HANDLERS',
      message: 'Handlers with consecutive sets (back-to-back)',
      severity: 'info',
      count: backToBackHandlers.length,
      icon: React.createElement(Clock),
      extra: { backToBackHandlers },
    }
  }
  return null
}

export const dogsNotInSetsRule: ValidationRule<Partial<Practice>> = (practice, context) => {
  const attendances = practice.attendances as ExtendedAttendanceData[] || []
  const sets = practice.sets || []

  // Get confirmed dog IDs, but only for active dogs
  const confirmedDogIds = new Set(
    attendances
      .filter(attendance => attendance.attending === AttendanceStatus.Attending)
      .map(attendance => attendance.dogId)
      .filter(dogId => {
        const dog = context?.dogs?.find(d => d.id === dogId)
        return dog && dog.status === DogStatus.Active
      })
  )

  // Count how many sets each dog is in
  const dogSetCounts = new Map<string, { dog: Dog, setCount: number, setIds: string[] }>()

  sets.forEach(set => {
    set.dogs?.forEach(setDog => {
      if (confirmedDogIds.has(setDog.dogId)) {
        const dog = context?.dogs?.find(d => d.id === setDog.dogId)
        if (dog) {
          if (dogSetCounts.has(setDog.dogId)) {
            const existing = dogSetCounts.get(setDog.dogId)!
            existing.setCount++
            existing.setIds.push(set.id)
          } else {
            dogSetCounts.set(setDog.dogId, {
              dog: dog,
              setCount: 1,
              setIds: [set.id]
            })
          }
        }
      }
    })
  })

  const dogsNotInSets: { dog: Dog }[] = []

  confirmedDogIds.forEach(dogId => {
    const dogInfo = dogSetCounts.get(dogId)
    const dog = context?.dogs?.find(d => d.id === dogId)

    if (!dogInfo && dog) {
      // Dog is confirmed but not in any sets
      dogsNotInSets.push({ dog })
    }
  })

  if (dogsNotInSets.length > 0) {
    return {
      code: 'DOGS_NOT_IN_SETS',
      message: 'Dogs confirmed for practice but not assigned to any sets',
      severity: 'error',
      count: dogsNotInSets.length,
      icon: React.createElement(ExclamationTriangle),
      extra: { dogsNotInSets },
    }
  }

  return null
}

export const dogsInOneSetRule: ValidationRule<Partial<Practice>> = (practice, context) => {
  const attendances = practice.attendances as ExtendedAttendanceData[] || []
  const sets = practice.sets || []

  // Get confirmed dog IDs, but only for active dogs
  const confirmedDogIds = new Set(
    attendances
      .filter(attendance => attendance.attending === AttendanceStatus.Attending)
      .map(attendance => attendance.dogId)
      .filter(dogId => {
        const dog = context?.dogs?.find(d => d.id === dogId)
        return dog && dog.status === DogStatus.Active
      })
  )

  // Count how many sets each dog is in
  const dogSetCounts = new Map<string, { dog: Dog, setCount: number, setIds: string[] }>()

  sets.forEach(set => {
    set.dogs?.forEach(setDog => {
      if (confirmedDogIds.has(setDog.dogId)) {
        const dog = context?.dogs?.find(d => d.id === setDog.dogId)
        if (dog) {
          if (dogSetCounts.has(setDog.dogId)) {
            const existing = dogSetCounts.get(setDog.dogId)!
            existing.setCount++
            existing.setIds.push(set.id)
          } else {
            dogSetCounts.set(setDog.dogId, {
              dog: dog,
              setCount: 1,
              setIds: [set.id]
            })
          }
        }
      }
    })
  })

  const dogsInOneSet: { dog: Dog, setIds: string[] }[] = []

  confirmedDogIds.forEach(dogId => {
    const dogInfo = dogSetCounts.get(dogId)

    if (dogInfo && dogInfo.setCount === 1) {
      // Dog is in only one set
      dogsInOneSet.push({ dog: dogInfo.dog, setIds: dogInfo.setIds })
    }
  })

  if (dogsInOneSet.length > 0) {
    return {
      code: 'DOGS_IN_ONE_SET',
      message: `Dogs not assigned to enough sets (ideally ${IDEAL_SETS_PER_DOG} sets per dog)`,
      severity: 'warning',
      count: dogsInOneSet.length,
      icon: React.createElement(ExclamationTriangle),
      extra: { dogsInOneSet },
    }
  }

  return null
}

export const dogsInManySetsRule: ValidationRule<Partial<Practice>> = (practice, context) => {
  const attendances = practice.attendances as ExtendedAttendanceData[] || []
  const sets = practice.sets || []

  // Get confirmed dog IDs, but only for active dogs
  const confirmedDogIds = new Set(
    attendances
      .filter(attendance => attendance.attending === AttendanceStatus.Attending)
      .map(attendance => attendance.dogId)
      .filter(dogId => {
        const dog = context?.dogs?.find(d => d.id === dogId)
        return dog && dog.status === DogStatus.Active
      })
  )

  // Count how many sets each dog is in
  const dogSetCounts = new Map<string, { dog: Dog, setCount: number, setIds: string[] }>()

  sets.forEach(set => {
    set.dogs?.forEach(setDog => {
      if (confirmedDogIds.has(setDog.dogId)) {
        const dog = context?.dogs?.find(d => d.id === setDog.dogId)
        if (dog) {
          if (dogSetCounts.has(setDog.dogId)) {
            const existing = dogSetCounts.get(setDog.dogId)!
            existing.setCount++
            existing.setIds.push(set.id)
          } else {
            dogSetCounts.set(setDog.dogId, {
              dog: dog,
              setCount: 1,
              setIds: [set.id]
            })
          }
        }
      }
    })
  })

  const dogsInManySets: { dog: Dog, setCount: number, setIds: string[] }[] = []

  confirmedDogIds.forEach(dogId => {
    const dogInfo = dogSetCounts.get(dogId)

    if (dogInfo && dogInfo.setCount > IDEAL_SETS_PER_DOG) {
      // Dog is in more than ideal number of sets
      dogsInManySets.push({
        dog: dogInfo.dog,
        setCount: dogInfo.setCount,
        setIds: dogInfo.setIds
      })
    }
  })

  if (dogsInManySets.length > 0) {
    return {
      code: 'DOGS_IN_MANY_SETS',
      message: `Dogs assigned to more than ${IDEAL_SETS_PER_DOG} sets`,
      severity: 'info',
      count: dogsInManySets.length,
      icon: React.createElement(ListOl),
      extra: { dogsInManySets },
    }
  }

  return null
}

// --- Service ---

export class PracticeValidationService {
  private static validator = new Validator<Partial<Practice>>([
    unconfirmedAttendanceRule,
    timingRule,
    setConfigurationRule,
    setAttendanceRule,
    sameHandlerInSetRule,
    backToBackHandlerRule,
    dogsNotInSetsRule,
    dogsInOneSetRule,
    dogsInManySetsRule,
  ])

  static validatePractice(practice: Partial<Practice>, context?: ValidationContext): ValidationResult {
    return this.validator.validate(practice, context)
  }
}
