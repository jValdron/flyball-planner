import React from 'react'
import { ListGroup, Alert } from 'react-bootstrap'
import type { ValidationError, AttendanceValidator } from '../../services/practiceValidation'
import type { AttendanceStatus, Dog } from '../../graphql/generated/graphql'

interface PracticeValidationProps {
  validationErrors: ValidationError[]
}

function isAttendanceValidator(validator: any): validator is AttendanceValidator {
  return validator && 'unconfirmedAttendances' in validator
}

export function PracticeValidation({ validationErrors }: PracticeValidationProps) {
  if (validationErrors.length === 0) {
    return (
      <Alert variant="success">
        All validation checks passed successfully!
      </Alert>
    )
  }

  const sortedErrors = [...validationErrors].sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 }
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff

    return a.message.localeCompare(b.message)
  })

  return (
    <ListGroup className="mb-3">
      {sortedErrors.map((error, index) => (
        <React.Fragment key={index}>
          <ListGroup.Item
            variant={error.severity === 'error' ? 'danger' : error.severity === 'warning' ? 'warning' : 'info'}
            className="d-flex align-items-center"
          >
            {error.icon && React.cloneElement(error.icon as React.ReactElement<{ className?: string }>, { className: 'me-2' })}
            <div className="ms-2 me-auto">{error.message}</div>
            {error.count && <span className="badge bg-primary rounded-pill">{error.count}</span>}
          </ListGroup.Item>
          {error.code === 'UNCONFIRMED_ATTENDANCES' &&
          error.validator &&
          isAttendanceValidator(error.validator) &&
          error.validator.unconfirmedAttendances &&
          error.validator.unconfirmedAttendances.length <= 5 && (
            <ListGroup>
            {error.validator.unconfirmedAttendances.map((attendance: { dogId: string, attending: AttendanceStatus, dog: Dog }, attendanceIndex: number) => (
              <ListGroup.Item
                key={`${index}-${attendanceIndex}`}
                className="d-flex align-items-center ps-5"
              >
                {attendance.dog?.name ?? attendance.dogId}
              </ListGroup.Item>
            ))}
            </ListGroup>
          )}
        </React.Fragment>
      ))}
    </ListGroup>
  )
}
