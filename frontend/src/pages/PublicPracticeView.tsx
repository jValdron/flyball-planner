import { useState } from 'react'
import { Container, Alert, Spinner, Button, Badge, Card, OverlayTrigger, Tooltip, Row, Col } from 'react-bootstrap'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, gql } from '@apollo/client'
import { formatFullDateTime } from '../utils/dateUtils'
import { Printer, Globe } from 'react-bootstrap-icons'
import { getSetTypeDisplayName } from '../utils/setTypeUtils'
import { PracticeStatus, Lane } from '../graphql/generated/graphql'
import './PublicPracticeView.css'

const GET_PUBLIC_PRACTICE = gql`
  query GetPublicPractice($id: String!, $code: String!) {
    publicPractice(id: $id, code: $code) {
      id
      scheduledAt
      status
      clubId
      createdAt
      updatedAt
      club {
        id
        name
        nafaClubNumber
        locations {
          id
          name
          isDefault
          isDoubleLane
        }
      }
      attendances {
        id
        attending
        dogId
        dog {
          id
          name
          crn
          trainingLevel
          owner {
            id
            givenName
            surname
          }
        }
        createdAt
        updatedAt
      }
      sets {
        id
        index
        notes
        type
        typeCustom
        isWarmup
        createdAt
        updatedAt
        location {
          id
          name
          isDoubleLane
        }
        dogs {
          id
          index
          lane
          dogId
          dog {
            id
            name
            crn
            trainingLevel
            owner {
              id
              givenName
              surname
            }
          }
        }
      }
    }
  }
`

export default function PublicPracticeView() {
  const { practiceId } = useParams()
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const [showCopyTooltip, setShowCopyTooltip] = useState(false)

  const { data, loading, error } = useQuery(GET_PUBLIC_PRACTICE, {
    variables: {
      id: practiceId!,
      code: code!
    },
    skip: !practiceId || !code
  })

  const practice = data?.publicPractice

  const handlePrint = () => {
    window.print()
  }

  const handleCopyUrl = () => {
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowCopyTooltip(true)
      setTimeout(() => setShowCopyTooltip(false), 3000)
    }).catch(console.error)
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (error || !practice) {
    return (
      <Container>
        <Alert variant="danger" className="mt-4">
          {error ? error.message : 'Practice not found or invalid access code'}
        </Alert>
      </Container>
    )
  }

  const isDraft = practice.status === PracticeStatus.Draft

  return (
    <Container className="public-practice-view mt-3">
      {/* Header with buttons */}
      <Row className="mb-4">
        <Col xs={12} className="position-relative">
          <div className="text-center">
            <h1 className="mb-2">
              {practice.club.name} Practice
            </h1>
            <h2 className="text-muted mb-3">
              {formatFullDateTime(practice.scheduledAt, true)}
            </h2>
            {isDraft && (
              <Badge bg="warning" className="fs-4 px-3 py-2 mb-3">
                DRAFT
              </Badge>
            )}
          </div>
          <div className="d-print-none position-absolute top-0 end-0 d-flex gap-2">
            <OverlayTrigger
              placement="bottom"
              show={showCopyTooltip}
              overlay={<Tooltip>URL copied to clipboard!</Tooltip>}
            >
              <Button variant="outline-primary" onClick={handleCopyUrl}>
                <Globe className="me-2" />
                Copy Public URL
              </Button>
            </OverlayTrigger>
            <Button variant="success" onClick={handlePrint}>
              <Printer className="me-2" />
              Print
            </Button>
          </div>
        </Col>
      </Row>


      {/* Practice Sets */}
      {practice.sets.length === 0 ? (
        <p className="text-muted text-center">No sets planned yet</p>
      ) : (
        <div className="sets-list d-flex flex-wrap gap-3">
          {Object.entries(
            [...practice.sets]
              .sort((a, b) => a.index - b.index)
              .reduce((groups, set) => {
                const key = set.index.toString()
                if (!groups[key]) {
                  groups[key] = []
                }
                groups[key].push(set)
                return groups
              }, {} as Record<string, Array<typeof practice.sets[0]>>)
          ).map(([index, sets]) => (
            <Card key={index}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">
                      <span className="fw-normal">Set {index}{(sets as any[])[0].type ? ' -' : ''}</span>
                      {(sets as any[])[0].type && (
                        <span className="ms-2 fw-bold">
                          {(sets as any[])[0].typeCustom || getSetTypeDisplayName((sets as any[])[0].type as any)}
                        </span>
                      )}
                    </h5>
                  </div>
                  <div className="text-end">
                    {(sets as any[]).some((set: any) => set.isWarmup) && (
                      <Badge bg="info">Warmup</Badge>
                    )}
                  </div>
                </Card.Header>
              <Card.Body>
                {(sets as any[]).map((set: any, setIndex: number) => (
                  <div key={set.id}>
                    {setIndex > 0 && <hr className="my-3" />}
                    {set.location.name !== practice.club.locations?.find((l: any) => l.isDefault)?.name && (
                      <div className="mb-2">
                        <strong>{set.location.name}</strong>
                        {set.location.isDoubleLane && ' (Double Lane)'}
                      </div>
                    )}
                    {set.dogs.length > 0 ? (
                      <div className="lane-container">
                        {(() => {
                          // Check if this is a double lane setup and has dogs in both lanes
                          const isDoubleLane = set.location.isDoubleLane
                          const hasDogsInLeftLane = set.dogs.some((d: any) => d.lane === Lane.Left)
                          const hasDogsInRightLane = set.dogs.some((d: any) => d.lane === Lane.Right)
                          const hasDogsInBothLanes = hasDogsInLeftLane && hasDogsInRightLane

                          if (isDoubleLane && hasDogsInBothLanes) {
                            // For double lane setups with dogs in both lanes, force 50/50 with explicit width
                            return [Lane.Left, Lane.Right].map(lane => {
                              const laneDogs = set.dogs.filter((d: any) => d.lane === lane)

                              return (
                                <div key={lane} className={`lane-column ${lane === Lane.Left ? 'left' : 'right'}`}>
                                  <div className={`lane-dogs ${laneDogs.length < 5 ? 'force-wrap' : ''} ${lane === Lane.Right ? 'justify-content-end' : ''}`}>
                                    {[...laneDogs]
                                      .sort((a, b) => a.index - b.index)
                                      .map((setDog) => (
                                        <Badge
                                          key={setDog.id}
                                          bg="secondary"
                                          className="me-1 mb-1"
                                        >
                                          {setDog.dog.name}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              )
                            })
                          } else {
                            // For single lane setups or double lane with dogs in only one lane, render all dogs in one lane
                            const allDogs = set.dogs.filter((d: any) => d.lane === null || d.lane === Lane.Left || d.lane === Lane.Right)
                            return (
                              <div key="single" className="single-lane">
                                <div className={`lane-dogs ${allDogs.length < 5 ? 'force-wrap' : ''}`}>
                                  {[...allDogs]
                                    .sort((a, b) => a.index - b.index)
                                    .map((setDog) => (
                                      <Badge
                                        key={setDog.id}
                                        bg="secondary"
                                        className="me-1 mb-1"
                                      >
                                        {setDog.dog.name}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )
                          }
                        })()}
                      </div>
                    ) : (
                      <p className="text-muted">No dogs assigned</p>
                    )}
                    {set.notes && (
                      <div className="mt-2 text-muted">
                        {set.notes}
                      </div>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </Container>
  )
}
