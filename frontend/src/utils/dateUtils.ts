export const formatDateHeader = (dateTime: string | null): string => {
  if (!dateTime) return 'Not scheduled'
  const date = new Date(dateTime)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

export const formatTime = (dateTime: string | null): string => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export const formatRelativeTime = (dateTime: string | null): string => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0) return `in ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}

export const formatFullDateTime = (dateTime: string | null): string => {
  if (!dateTime) return 'Not scheduled'
  const date = new Date(dateTime)
  return date.toLocaleString()
}

export const isPastDay = (dateTime: string | null): boolean => {
  if (!dateTime) return false
  const date = new Date(dateTime)
  const now = new Date()

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return startOfDate < startOfToday
}
