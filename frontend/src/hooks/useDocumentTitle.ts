import { useEffect } from 'react'

const BASE_TITLE = 'Flyball Planner'

export const useDocumentTitle = (title?: string) => {
  useEffect(() => {
    const fullTitle = title ? `${title} - ${BASE_TITLE}` : BASE_TITLE
    document.title = fullTitle

    return () => {
      document.title = BASE_TITLE
    }
  }, [title])
}
