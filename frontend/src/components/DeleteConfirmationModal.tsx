import { Modal, Button } from 'react-bootstrap'
import { useEffect, useRef } from 'react'

interface DeleteConfirmationModalProps {
  show: boolean
  onHide: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmButtonText?: string
}

function DeleteConfirmationModal({
  show,
  onHide,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item?',
  confirmButtonText = 'Delete'
}: DeleteConfirmationModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (show) {
      setTimeout(() => {
        confirmButtonRef.current?.focus()
      }, 0)
    }
  }, [show])

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          ref={confirmButtonRef}
          variant="danger"
          onClick={onConfirm}
        >
          {confirmButtonText}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default DeleteConfirmationModal
