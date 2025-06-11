import { differenceInDays, format, formatRelative, isPast } from 'date-fns'

export const formatTime = (dateTime: string | null): string => {
  if (!dateTime) return ''
  return format(new Date(dateTime), 'h:mm a')
}

export const formatRelativeTime = (dateTime: string | null): string => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  const now = new Date()
  if (differenceInDays(date, now) >= 6 || isPast(date)) {
    return format(date, 'PPpp')
  } else {
    return formatRelative(date, now)
  }
}

export const formatFullDateTime = (dateTime: string | null): string => {
  if (!dateTime) return 'Not scheduled'
  return format(new Date(dateTime), 'PPpp')
}

export const isPastDay = (dateTime: string | null): boolean => {
  if (!dateTime) return false
  return new Date(dateTime) < new Date()
}
