import { useState } from 'react'
import { Container, Alert, Spinner, Button, Badge, OverlayTrigger, Tooltip, Row, Col } from 'react-bootstrap'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, gql } from '@apollo/client'
import { formatFullDateTime } from '../utils/dateUtils'
import { Printer, Globe } from 'react-bootstrap-icons'
import { PracticeStatus } from '../graphql/generated/graphql'
import { SetViewOnly } from '../components/PracticeSet/SetViewOnly'
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
    <Container className="public-practice-view mt-3 mb-5">
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
      <SetViewOnly
        sets={practice.sets}
        defaultLocationName={practice.club.locations?.find((l: any) => l.isDefault)?.name}
        twoColumns={true}
      />
    </Container>
  )
}
