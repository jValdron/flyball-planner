import React from 'react'

import { ListGroup, Alert } from 'react-bootstrap'

import type { AttendanceStatus, Dog } from '../../graphql/generated/graphql'
import type { ValidationError } from '../../services/practiceValidation'

interface PracticeValidationProps {
  validationErrors: ValidationError[]
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
            className={`d-flex align-items-center rounded-top-2 border-top-width-1 ${!error.extra ? ' mb-3 rounded-bottom-2' : ''}`}
          >
            {error.icon && React.cloneElement(error.icon as React.ReactElement<{ className?: string }>, { className: 'me-2' })}
            <div className="ms-2 me-auto">{error.message}</div>
            {error.count && <span className="badge bg-primary rounded-pill">{error.count}</span>}
          </ListGroup.Item>
          {error.code === 'UNCONFIRMED_ATTENDANCES' &&
            error.extra?.unconfirmedAttendances && (
              <ListGroup id="unconfirmed-attendances" className="mb-3 rounded-top-0">
                {error.extra.unconfirmedAttendances.length <= 5 ? (
                  error.extra.unconfirmedAttendances.map((attendance: { dogId: string, attending: AttendanceStatus, dog?: Dog | null }, attendanceIndex: number) => (
                    <ListGroup.Item
                      key={`${index}-${attendanceIndex}`}
                      className="d-flex align-items-center ps-5 rounded-top-0"
                    >
                      {attendance.dog?.name ?? attendance.dogId}
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="d-flex align-items-center ps-5 rounded-top-0">
                    <div>
                      {error.extra.unconfirmedAttendances.length} dogs with <strong>unconfirmed attendance</strong>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            )}
          {error.code === 'UNCONFIRMED_SET_ATTENDANCES' &&
            error.extra?.unconfirmedSetAttendances &&
            error.extra.unconfirmedSetAttendances.length <= 5 && (
              <ListGroup id="unconfirmed-set-attendances" className="mb-3 rounded-top-0 border-top-width-1">
                {error.extra.unconfirmedSetAttendances.map((attendance: { dogId: string, dog?: Dog | null, setIndex: number }, attendanceIndex: number) => (
                  <ListGroup.Item
                    key={`${index}-${attendanceIndex}`}
                    className="d-flex align-items-center ps-5 rounded-top-0"
                  >
                    {attendance.dog?.name ?? attendance.dogId}
                    <span className="ms-2 text-muted">(Set {attendance.setIndex})</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          {error.code === 'SAME_HANDLER_IN_SET' &&
            error.extra?.conflicts && (
              <ListGroup id="same-handler-in-set" className="mb-3 rounded-top-0">
                {error.extra.conflicts.map((conflict: { handlerName: string, setIndex: number, dogNames: string[], dogIds: string[] }, conflictIndex: number) => (
                  <ListGroup.Item
                    key={`${index}-${conflictIndex}`}
                    className="d-flex align-items-center ps-5 rounded-top-0"
                  >
                    <div>
                      <strong>{conflict.handlerName}</strong>
                      <span className="ms-2 text-muted">(Set {conflict.setIndex})</span>
                      <div className="text-muted small">
                        Dogs: {conflict.dogNames.join(', ')}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          {error.code === 'BACK_TO_BACK_HANDLERS' &&
            error.extra?.backToBackHandlers && (
              <ListGroup id="back-to-back-handlers" className="mb-3 rounded-top-0">
                {error.extra.backToBackHandlers.map((handler: { handlerName: string, setIndices: number[], dogIds: string[] }, handlerIndex: number) => (
                  <ListGroup.Item
                    key={`${index}-${handlerIndex}`}
                    className="d-flex align-items-center ps-5 rounded-top-0"
                  >
                    <div>
                      <strong>{handler.handlerName}</strong>
                      <span className="ms-2 text-muted">(Sets {handler.setIndices.join(' ↔ ')})</span>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          {error.code === 'DOGS_NOT_IN_SETS' &&
            error.extra?.dogsNotInSets && (
              <ListGroup id="dogs-not-in-sets" className="mb-3 rounded-top-0">
                {error.extra.dogsNotInSets.map((dogInfo: { dog: Dog }, dogIndex: number) => (
                  <ListGroup.Item
                    key={`${index}-${dogIndex}`}
                    className="d-flex align-items-center ps-5 rounded-top-0"
                  >
                    <div>
                      <strong>{dogInfo.dog.name}</strong>
                      <span className="ms-2 text-muted">(Not assigned to any sets)</span>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          {error.code === 'DOGS_IN_ONE_SET' &&
            error.extra?.dogsInOneSet && (
              <ListGroup id="dogs-in-one-set" className="mb-3 rounded-top-0">
                {error.extra.dogsInOneSet.map((dogInfo: { dog: Dog, setIds: string[] }, dogIndex: number) => (
                  <ListGroup.Item
                    key={`${index}-${dogIndex}`}
                    className="d-flex align-items-center ps-5 rounded-top-0"
                  >
                    <div>
                      <strong>{dogInfo.dog.name}</strong>
                      <span className="ms-2 text-muted">(1 set)</span>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          {error.code === 'DOGS_IN_MANY_SETS' &&
            error.extra?.dogsInManySets && (
              <ListGroup id="dogs-in-many-sets" className="mb-3 rounded-top-0">
                {error.extra.dogsInManySets.map((dogInfo: { dog: Dog, setCount: number, setIds: string[] }, dogIndex: number) => (
                  <ListGroup.Item
                    key={`${index}-${dogIndex}`}
                    className="d-flex align-items-center ps-5 rounded-top-0"
                  >
                    <div>
                      <strong>{dogInfo.dog.name}</strong>
                      <span className="ms-2 text-muted">({dogInfo.setCount} sets)</span>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          {error.code === 'INSUFFICIENT_DOG_REST' &&
            error.extra?.insufficientRest && (
              <ListGroup id="insufficient-dog-rest" className="mb-3 rounded-top-0">
                {error.extra.insufficientRest.map((dogInfo: { dog: Dog, setGaps: { from: number, to: number, gap: number }[] }, dogIndex: number) => (
                  <ListGroup.Item
                    key={`${index}-${dogIndex}`}
                    className="d-flex align-items-center ps-5 rounded-top-0"
                  >
                    <div>
                      <strong>{dogInfo.dog.name}</strong>
                      <div className="text-muted small">
                        {dogInfo.setGaps.map((gap, gapIndex) => (
                          <span key={gapIndex}>
                            Sets {gap.from} → {gap.to} ({gap.gap} sets apart)
                            {gapIndex < dogInfo.setGaps.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          {error.code === 'SUBOPTIMAL_DOG_REST' &&
            error.extra?.suboptimalRest && (
              <ListGroup id="suboptimal-dog-rest" className="mb-3 rounded-top-0">
                {error.extra.suboptimalRest.map((dogInfo: { dog: Dog, setGaps: { from: number, to: number, gap: number }[] }, dogIndex: number) => (
                  <ListGroup.Item
                    key={`${index}-${dogIndex}`}
                    className="d-flex align-items-center ps-5"
                  >
                    <div>
                      <strong>{dogInfo.dog.name}</strong>
                      <div className="text-muted small">
                        {dogInfo.setGaps.map((gap, gapIndex) => (
                          <span key={gapIndex}>
                            Sets {gap.from} → {gap.to} ({gap.gap} sets apart)
                            {gapIndex < dogInfo.setGaps.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          {error.code === 'EMPTY_SETS' &&
            error.extra?.emptySets && (
              <ListGroup id="empty-sets" className="mb-3 rounded-top-0">
                {error.extra.emptySets.map((setInfo: { setId: string, setIndex: number }, setIndex: number) => (
                  <ListGroup.Item
                    key={`${index}-${setIndex}`}
                    className="d-flex align-items-center ps-5"
                  >
                    <div>
                      <strong>Set {setInfo.setIndex}</strong>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
        </React.Fragment>
      ))}
    </ListGroup>
  )
}
