import type { PracticeSummary } from '../graphql/generated/graphql'
import { isPastDay } from './dateUtils'

export type PracticeStep = 'date' | 'attendance' | 'sets' | 'checks' | 'recap'

export interface PracticeCompletionStatus {
  dateComplete: boolean
  attendanceComplete: boolean
  nextIncompleteStep: PracticeStep | null
}

/**
 * Determines the completion status of a practice and identifies the next incomplete step
 */
export function getPracticeCompletionStatus(practice: PracticeSummary): PracticeCompletionStatus {
  // Date & Time is complete if scheduledAt is set
  const dateComplete = !!practice.scheduledAt

  // Attendance is complete if no attendances have Unknown status
  const attendanceComplete = practice.unconfirmedCount === 0

  // Check if practice is past
  const practiceIsPast = isPastDay(practice.scheduledAt)

  // Determine the next incomplete step
  let nextIncompleteStep: PracticeStep | null = null

  if (!dateComplete) {
    nextIncompleteStep = 'date'
  } else if (!attendanceComplete) {
    nextIncompleteStep = 'attendance'
  } else if (practiceIsPast && practice.status === 'Ready') {
    // For ready past practices, go to recap
    nextIncompleteStep = 'recap'
  } else {
    // Both date and attendance are complete
    // If practice is Ready, go to checks; if Draft, go to sets
    nextIncompleteStep = practice.status === 'Ready' ? 'checks' : 'sets'
  }

  return {
    dateComplete,
    attendanceComplete,
    nextIncompleteStep
  }
}

/**
 * Gets the URL path for the next incomplete step
 */
export function getNextIncompleteStepUrl(practiceId: string, nextStep: PracticeStep | null): string {
  if (!nextStep) {
    return `/practices/${practiceId}`
  }

  if (nextStep === 'date') {
    return `/practices/${practiceId}`
  }

  return `/practices/${practiceId}/${nextStep}`
}
