import type { Dog, Practice } from '../graphql/generated/graphql'
import { AttendanceStatus } from '../graphql/generated/graphql'
import React from 'react'
import { ListOl, QuestionLg } from 'react-bootstrap-icons'

export type ValidationSeverity = 'info' | 'warning' | 'error'

export interface ValidationError {
  code: string
  message: string
  severity: ValidationSeverity
  count?: number
  icon?: React.ReactNode
  validator?: AttendanceValidator | TimingValidator | SetConfigurationValidator
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export abstract class BaseValidator<T> {
  protected errors: ValidationError[] = []

  abstract validate(data: T): ValidationResult

  protected addError(code: string, message: string, severity: ValidationSeverity = 'warning', count?: number, icon?: React.ReactNode): void {
    this.errors.push({ code, message, severity, count, icon, validator: this as any })
  }

  protected clearErrors(): void {
    this.errors = []
  }

  protected getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors]
    }
  }
}

export class AttendanceValidator extends BaseValidator<Partial<Practice>> {
  unconfirmedAttendances: { dogId: string, attending: AttendanceStatus, dog: Dog }[] = []

  validate(practice: Partial<Practice>): ValidationResult {
    this.clearErrors()

    const unconfirmedAttendances = practice.attendances?.filter(
      attendance => attendance.attending === AttendanceStatus.Unknown
    )

    if (unconfirmedAttendances && unconfirmedAttendances?.length > 0) {
      this.addError(
        'UNCONFIRMED_ATTENDANCES',
        'Dogs with unconfirmed attendance',
        'info',
        unconfirmedAttendances.length,
        React.createElement(QuestionLg)
      )

      this.unconfirmedAttendances = unconfirmedAttendances
    }

    return this.getResult()
  }
}

export class TimingValidator extends BaseValidator<Partial<Practice>> {
  validate(practice: Partial<Practice>): ValidationResult {
    this.clearErrors()

    const practiceDate = new Date(practice.scheduledAt)
    const now = new Date()

    // Check if practice is in the past
    if (practiceDate < now) {
      this.addError(
        'PAST_PRACTICE',
        'Practice has already happened, you cannot edit it anymore',
        'error'
      )
    }

    // Check if practice is too far in the future (e.g., more than 3 months)
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    if (practiceDate > threeMonthsFromNow) {
      this.addError(
        'FUTURE_PRACTICE',
        'Practice is scheduled more than 3 months in advance',
        'warning'
      )
    }

    return this.getResult()
  }
}

export class SetConfigurationValidator extends BaseValidator<Partial<Practice>> {
  validate(practice: Partial<Practice>): ValidationResult {
    this.clearErrors()

    const confirmedAttendances = practice.attendances?.filter(
      attendance => attendance.attending === AttendanceStatus.Attending
    ) || []

    // Check if there are enough dogs for a practice
    if (confirmedAttendances.length < 4) {
      this.addError(
        'INSUFFICIENT_DOGS',
        `Not enough dogs confirmed for practice (${confirmedAttendances.length}/4 minimum)`,
        'error',
        undefined,
        React.createElement(ListOl)
      )
    }

    // Check if sets are configured
    if (!practice.sets || practice.sets.length === 0) {
      this.addError(
        'NO_SETS_CONFIGURED',
        'No sets have been configured for confirmed dogs',
        'error',
        undefined,
        React.createElement(ListOl)
      )
    }

    return this.getResult()
  }
}

export class PracticeValidationService {
  private static validators: BaseValidator<Partial<Practice>>[] = [
    new AttendanceValidator(),
    new TimingValidator(),
    new SetConfigurationValidator()
  ]

  static validatePractice(practice: Partial<Practice>): ValidationResult {
    const allErrors: ValidationError[] = []
    let isValid = true

    for (const validator of this.validators) {
      const result = validator.validate(practice)
      allErrors.push(...result.errors)
      isValid = isValid && result.isValid
    }

    return {
      isValid: isValid,
      errors: allErrors
    }
  }

  static addValidator(validator: BaseValidator<Partial<Practice>>): void {
    this.validators.push(validator)
  }
}
