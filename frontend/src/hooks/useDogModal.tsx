import { useRef, useMemo } from 'react'
import DogModal, { type DogModalRef } from '../components/DogModal'
import type { Dog } from '../graphql/generated/graphql'

type DogForModal = Pick<Dog, 'id' | 'name' | 'crn' | 'trainingLevel' | 'ownerId' | 'status'>

export const useDogModal = () => {
  const modalRef = useRef<DogModalRef>(null)

  const openCreateModal = (ownerId?: string) => {
    modalRef.current?.open({ ownerId })
  }

  const openEditModal = (dog: DogForModal) => {
    modalRef.current?.open({ dog })
  }

  const closeModal = () => {
    modalRef.current?.close()
  }

  const DogModalComponent = useMemo(() => (props: { onSuccess?: () => void }) => (
    <DogModal ref={modalRef} onSuccess={props.onSuccess} />
  ), [])

  return {
    openCreateModal,
    openEditModal,
    closeModal,
    DogModalComponent
  }
}
