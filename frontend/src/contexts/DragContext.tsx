import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core'

import type { SetDog } from '../graphql/generated/graphql'

interface DragContextType {
  draggedDog: SetDog | null
  draggedFromPicker: string | null
  dragOverPicker: string | null
  stickyTimer: NodeJS.Timeout | null
  isSticky: boolean
  stickyCountdown: number
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  clearStickyTimer: () => void
}

const DragContext = createContext<DragContextType | undefined>(undefined)

interface DragProviderProps {
  children: ReactNode
  onDogMove: (dog: SetDog, fromPicker: string, toPicker: string) => void
}

export function DragProvider({ children, onDogMove }: DragProviderProps) {
  const [draggedDog, setDraggedDog] = useState<SetDog | null>(null)
  const [draggedFromPicker, setDraggedFromPicker] = useState<string | null>(null)
  const [dragOverPicker, setDragOverPicker] = useState<string | null>(null)
  const [stickyTimer, setStickyTimer] = useState<NodeJS.Timeout | null>(null)
  const [isSticky, setIsSticky] = useState(false)
  const [stickyCountdown, setStickyCountdown] = useState(0)

  const clearStickyTimer = useCallback(() => {
    if (stickyTimer) {
      clearTimeout(stickyTimer)
      setStickyTimer(null)
    }
    setIsSticky(false)
    setStickyCountdown(0)
  }, [stickyTimer])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const data = active.data.current

    if (data?.setDog && data?.pickerId) {
      setDraggedDog(data.setDog)
      setDraggedFromPicker(data.pickerId)
      setIsSticky(true)
      setStickyCountdown(2)

      // Start countdown timer
      let countdown = 2
      const timer = setInterval(() => {
        countdown -= 0.1
        setStickyCountdown(Math.max(0, countdown))

        if (countdown <= 0) {
          clearInterval(timer)
          setIsSticky(false)
          setStickyCountdown(0)
        }
      }, 100)

      setStickyTimer(timer as NodeJS.Timeout)
    }
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event

    if (over && over.data.current?.pickerId) {
      setDragOverPicker(over.data.current.pickerId)
    } else {
      setDragOverPicker(null)
    }
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event

    clearStickyTimer()

    if (draggedDog && draggedFromPicker && over?.data.current?.pickerId) {
      const toPicker = over.data.current.pickerId

      // Only move if it's a different picker
      if (toPicker !== draggedFromPicker) {
        onDogMove(draggedDog, draggedFromPicker, toPicker)
      }
    }

    // Reset all drag state
    setDraggedDog(null)
    setDraggedFromPicker(null)
    setDragOverPicker(null)
  }, [draggedDog, draggedFromPicker, onDogMove, clearStickyTimer])

  const value: DragContextType = {
    draggedDog,
    draggedFromPicker,
    dragOverPicker,
    stickyTimer,
    isSticky,
    stickyCountdown,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    clearStickyTimer
  }

  return (
    <DragContext.Provider value={value}>
      {children}
    </DragContext.Provider>
  )
}

export function useDrag() {
  const context = useContext(DragContext)
  if (context === undefined) {
    throw new Error('useDrag must be used within a DragProvider')
  }
  return context
}
