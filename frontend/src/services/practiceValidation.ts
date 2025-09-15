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
  idealSetsPerDog?: number
}

export type ValidationRule<T> = (data: T, context?: ValidationContext) => ValidationError | null

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
  const backToBackHandlers: { handlerId: string, handlerName: string, setIndices: number[], dogIds: string[], setIds: string[] }[] = []

  // Group sets by index and sort them (excluding warmup sets)
  const setsByIndex = new Map<number, typeof sets>()
  sets.forEach(set => {
    if (set.isWarmup) return // Skip warmup sets
    if (!setsByIndex.has(set.index)) {
      setsByIndex.set(set.index, [])
    }
    setsByIndex.get(set.index)!.push(set)
  })

  const sortedIndices = Array.from(setsByIndex.keys()).sort((a, b) => a - b)

  // For each handler, find their consecutive set sequences
  const handlerSetMap = new Map<string, number[]>()

  // First, collect all sets each handler appears in
  sortedIndices.forEach(setIndex => {
    const currentSets = setsByIndex.get(setIndex) || []
    currentSets.forEach(set => {
      set.dogs?.forEach(setDog => {
        const dog = context.dogs.find(d => d.id === setDog.dogId)
        if (dog?.ownerId) {
          if (!handlerSetMap.has(dog.ownerId)) {
            handlerSetMap.set(dog.ownerId, [])
          }
          handlerSetMap.get(dog.ownerId)!.push(setIndex)
        }
      })
    })
  })

  // Find consecutive sequences for each handler
  handlerSetMap.forEach((setIndices, handlerId) => {
    const handler = context.handlers.find(h => h.id === handlerId)
    const handlerName = handler ?
      `${handler.givenName} ${handler.surname}` :
      'Unknown Handler'

    // Sort the set indices for this handler
    const sortedHandlerSets = [...setIndices].sort((a, b) => a - b)

    // Find consecutive sequences
    let currentSequence: number[] = []

    for (let i = 0; i < sortedHandlerSets.length; i++) {
      const currentSet = sortedHandlerSets[i]

      if (currentSequence.length === 0) {
        currentSequence = [currentSet]
      } else {
        const lastSetInSequence = currentSequence[currentSequence.length - 1]
        if (currentSet === lastSetInSequence + 1) {
          currentSequence.push(currentSet)
        } else {
          if (currentSequence.length > 1) {
            const { dogIds, setIds } = getDogsAndSetIdsInSets(currentSequence, setsByIndex, handlerId, context.dogs)
            backToBackHandlers.push({
              handlerId,
              handlerName,
              setIndices: [...currentSequence],
              dogIds,
              setIds
            })
          }
          currentSequence = [currentSet]
        }
      }
    }

    // Handle the final sequence
    if (currentSequence.length > 1) {
      const { dogIds, setIds } = getDogsAndSetIdsInSets(currentSequence, setsByIndex, handlerId, context.dogs)
      backToBackHandlers.push({
        handlerId,
        handlerName,
        setIndices: [...currentSequence],
        dogIds,
        setIds
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

// Helper function to get dogs and set IDs from specific sets for a specific handler
function getDogsAndSetIdsInSets(setIndices: number[], setsByIndex: Map<number, any[]>, handlerId: string, dogs: any[]): { dogIds: string[], setIds: string[] } {
  const dogIds: string[] = []
  const setIds: string[] = []

  setIndices.forEach(setIndex => {
    const sets = setsByIndex.get(setIndex) || []
    sets.forEach(set => {
      setIds.push(set.id)
      set.dogs?.forEach((setDog: any) => {
        const dog = dogs.find(d => d.id === setDog.dogId)
        if (dog?.ownerId === handlerId) {
          dogIds.push(dog.id)
        }
      })
    })
  })

  return { dogIds, setIds }
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

  // Count how many sets each dog is in (excluding warmup sets)
  const dogSetCounts = new Map<string, { dog: Dog, setCount: number, setIds: string[] }>()

  sets.forEach(set => {
    if (set.isWarmup) return

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
  const idealSetsPerDog = context?.idealSetsPerDog ?? 2

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
      message: `Dogs not assigned to enough sets (ideally ${idealSetsPerDog} sets per dog)`,
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

  // Count how many sets each dog is in (excluding warmup sets)
  const dogSetCounts = new Map<string, { dog: Dog, setCount: number, setIds: string[] }>()

  sets.forEach(set => {
    if (set.isWarmup) return

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
  const idealSetsPerDog = context?.idealSetsPerDog ?? 2

  confirmedDogIds.forEach(dogId => {
    const dogInfo = dogSetCounts.get(dogId)

    if (dogInfo && dogInfo.setCount > idealSetsPerDog) {
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
      message: `Dogs assigned to more than ${idealSetsPerDog} sets`,
      severity: 'info',
      count: dogsInManySets.length,
      icon: React.createElement(ListOl),
      extra: { dogsInManySets },
    }
  }

  return null
}

// Helper function to get dog set appearances (excluding warmup sets)
const getDogSetAppearances = (practice: Partial<Practice>, context?: ValidationContext) => {
  if (!context?.dogs) return new Map<string, number[]>()

  const sets = practice.sets || []
  if (sets.length < 2) return new Map<string, number[]>()

  // Group sets by index and sort them
  const setsByIndex = new Map<number, typeof sets>()
  sets.forEach(set => {
    if (!setsByIndex.has(set.index)) {
      setsByIndex.set(set.index, [])
    }
    setsByIndex.get(set.index)!.push(set)
  })

  const sortedIndices = Array.from(setsByIndex.keys()).sort((a, b) => a - b)

  // Track each dog's set appearances
  const dogSetAppearances = new Map<string, number[]>()

  sortedIndices.forEach(setIndex => {
    const currentSets = setsByIndex.get(setIndex) || []
    currentSets.forEach(set => {
      if (set.isWarmup) return

      set.dogs?.forEach(setDog => {
        const dog = context.dogs.find(d => d.id === setDog.dogId)
        if (dog && dog.status === DogStatus.Active) {
          if (!dogSetAppearances.has(setDog.dogId)) {
            dogSetAppearances.set(setDog.dogId, [])
          }
          dogSetAppearances.get(setDog.dogId)!.push(setIndex)
        }
      })
    })
  })

  return dogSetAppearances
}

export const insufficientDogRestRule: ValidationRule<Partial<Practice>> = (practice, context) => {
  if (!context?.dogs) return null

  const dogSetAppearances = getDogSetAppearances(practice, context)
  const insufficientRest: { dog: Dog, setGaps: { from: number, to: number, gap: number }[] }[] = []

  dogSetAppearances.forEach((setIndices, dogId) => {
    if (setIndices.length < 2) return // Need at least 2 sets to check gaps

    const dog = context.dogs.find(d => d.id === dogId)
    if (!dog) return

    const gaps: { from: number, to: number, gap: number }[] = []

    // Check gaps between consecutive set appearances
    for (let i = 0; i < setIndices.length - 1; i++) {
      const currentSet = setIndices[i]
      const nextSet = setIndices[i + 1]
      const gap = nextSet - currentSet - 1 // Gap is sets in between, not including the sets themselves

      gaps.push({ from: currentSet, to: nextSet, gap })
    }

    const insufficientGaps = gaps.filter(gap => gap.gap < 3)

    if (insufficientGaps.length > 0) {
      insufficientRest.push({ dog, setGaps: insufficientGaps })
    }
  })

  if (insufficientRest.length > 0) {
    return {
      code: 'INSUFFICIENT_DOG_REST',
      message: 'Dogs with insufficient rest between sets (less than 3 sets apart)',
      severity: 'warning',
      count: insufficientRest.length,
      icon: React.createElement(ExclamationTriangle),
      extra: { insufficientRest },
    }
  }

  return null
}

export const suboptimalDogRestRule: ValidationRule<Partial<Practice>> = (practice, context) => {
  if (!context?.dogs) return null

  const dogSetAppearances = getDogSetAppearances(practice, context)
  const suboptimalRest: { dog: Dog, setGaps: { from: number, to: number, gap: number }[] }[] = []

  dogSetAppearances.forEach((setIndices, dogId) => {
    if (setIndices.length < 2) return // Need at least 2 sets to check gaps

    const dog = context.dogs.find(d => d.id === dogId)
    if (!dog) return

    const gaps: { from: number, to: number, gap: number }[] = []

    // Check gaps between consecutive set appearances
    for (let i = 0; i < setIndices.length - 1; i++) {
      const currentSet = setIndices[i]
      const nextSet = setIndices[i + 1]
      const gap = nextSet - currentSet - 1 // Gap is sets in between, not including the sets themselves

      gaps.push({ from: currentSet, to: nextSet, gap })
    }

    const suboptimalGaps = gaps.filter(gap => gap.gap >= 3 && gap.gap < 5)

    if (suboptimalGaps.length > 0) {
      suboptimalRest.push({ dog, setGaps: suboptimalGaps })
    }
  })

  if (suboptimalRest.length > 0) {
    return {
      code: 'SUBOPTIMAL_DOG_REST',
      message: 'Dogs with suboptimal rest between sets (ideally 5 sets apart)',
      severity: 'info',
      count: suboptimalRest.length,
      icon: React.createElement(Clock),
      extra: { suboptimalRest },
    }
  }

  return null
}

export const emptySetRule: ValidationRule<Partial<Practice>> = (practice) => {
  const sets = practice.sets || []
  const emptySets: { setId: string, setIndex: number }[] = []

  sets.forEach(set => {
    if (!set.dogs || set.dogs.length === 0) {
      emptySets.push({
        setId: set.id,
        setIndex: set.index
      })
    }
  })

  if (emptySets.length > 0) {
    return {
      code: 'EMPTY_SETS',
      message: 'Sets with no dogs assigned',
      severity: 'error',
      count: emptySets.length,
      icon: React.createElement(ExclamationTriangle),
      extra: { emptySets },
    }
  }

  return null
}

export const practiceStatusRule: ValidationRule<Partial<Practice>> = (practice) => {
  // Only validate if practice has a status field
  if (!practice.status) return null

  // If practice is in Draft status, check if it's ready to be marked as Ready
  if (practice.status === 'Draft') {
    const attendances = practice.attendances as ExtendedAttendanceData[] || []
    const sets = practice.sets || []

    // Check if there are any confirmed attendances
    const confirmedAttendances = attendances.filter(
      attendance => attendance.attending === AttendanceStatus.Attending
    )

    // Check if there are any sets configured
    const hasSets = sets && sets.length > 0

    // Check if there are any unconfirmed attendances
    const unconfirmedAttendances = attendances.filter(
      attendance => attendance.attending === AttendanceStatus.Unknown
    )

    // If practice is in Draft but has confirmed dogs and sets, suggest it could be ready
    if (confirmedAttendances.length >= 4 && hasSets && unconfirmedAttendances.length === 0) {
      return {
        code: 'PRACTICE_READY_FOR_READY_STATUS',
        message: 'Practice should be marked as ready',
        severity: 'warning',
        icon: React.createElement(ExclamationTriangle),
      }
    }

    // If practice is in Draft but missing key requirements
    if (confirmedAttendances.length < 4) {
      return {
        code: 'PRACTICE_NOT_READY_INSUFFICIENT_DOGS',
        message: `Practice needs at least 4 confirmed dogs to be marked as "Ready" (currently ${confirmedAttendances.length})`,
        severity: 'warning',
        count: confirmedAttendances.length,
        icon: React.createElement(ExclamationTriangle),
      }
    }

    if (!hasSets) {
      return {
        code: 'PRACTICE_NOT_READY_NO_SETS',
        message: 'Practice needs sets configured to be marked as "Ready"',
        severity: 'warning',
        icon: React.createElement(ExclamationTriangle),
      }
    }

    if (unconfirmedAttendances.length > 0) {
      return {
        code: 'PRACTICE_NOT_READY_UNCONFIRMED_ATTENDANCES',
        message: `Practice has ${unconfirmedAttendances.length} unconfirmed attendance(s) - consider confirming all before marking as "Ready"`,
        severity: 'info',
        count: unconfirmedAttendances.length,
        icon: React.createElement(QuestionLg),
      }
    }
  }

  // If practice is in Ready status, check if it should be reverted to Draft
  if (practice.status === 'Ready') {
    const attendances = practice.attendances as ExtendedAttendanceData[] || []
    const sets = practice.sets || []

    // Check if there are any confirmed attendances
    const confirmedAttendances = attendances.filter(
      attendance => attendance.attending === AttendanceStatus.Attending
    )

    // Check if there are any sets configured
    const hasSets = sets && sets.length > 0

    // If practice is marked as Ready but missing key requirements, suggest reverting to Draft
    if (confirmedAttendances.length < 4 || !hasSets) {
      return {
        code: 'PRACTICE_READY_STATUS_INVALID',
        message: 'Practice marked as "Ready" but missing required elements - consider reverting to "Draft"',
        severity: 'error',
        icon: React.createElement(ExclamationTriangle),
      }
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
    insufficientDogRestRule,
    suboptimalDogRestRule,
    emptySetRule,
    practiceStatusRule,
  ])

  static validatePractice(practice: Partial<Practice>, context?: ValidationContext): ValidationResult {
    return this.validator.validate(practice, context)
  }
}
