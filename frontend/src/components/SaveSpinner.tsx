import { Spinner, Toast } from 'react-bootstrap'
import { useEffect, useState } from 'react'

interface SaveSpinnerProps {
  show: boolean
  message?: string | null
  visibleDuration?: number
  transitionDuration?: number
}

export function SaveSpinner({
  show,
  message,
  visibleDuration = 500,
  transitionDuration = 250
}: SaveSpinnerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    let hideTimeout: NodeJS.Timeout | undefined
    let removeTimeout: NodeJS.Timeout | undefined
    let showTimeout: NodeJS.Timeout | undefined

    if (show) {
      if (hideTimeout) clearTimeout(hideTimeout)
      if (removeTimeout) clearTimeout(removeTimeout)
      if (showTimeout) clearTimeout(showTimeout)

      setShouldRender(true)
      setIsVisible(false)
      showTimeout = setTimeout(() => {
        setIsVisible(true)
      }, 1)
    } else {
      hideTimeout = setTimeout(() => {
        setIsVisible(false)
        removeTimeout = setTimeout(() => {
          setShouldRender(false)
        }, transitionDuration)
      }, visibleDuration)
    }

    return () => {
      if (hideTimeout) clearTimeout(hideTimeout)
      if (removeTimeout) clearTimeout(removeTimeout)
      if (showTimeout) clearTimeout(showTimeout)
    }
  }, [show, transitionDuration])

  if (!shouldRender) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${transitionDuration}ms ease-in-out`
      }}
    >
      <Toast show>
        <Toast.Body className="d-flex align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          {message || 'Saving...'}
        </Toast.Body>
      </Toast>
    </div>
  )
}
