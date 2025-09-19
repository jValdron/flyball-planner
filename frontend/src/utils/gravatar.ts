import crypto from 'crypto-js'

/**
 * Generate a Gravatar URL from an email address
 * @param email - The email address to generate a Gravatar for
 * @param size - The size of the avatar image (default: 32)
 * @param defaultImage - The default image type if no Gravatar is found (default: 'identicon')
 * @returns The Gravatar URL
 */
export function getGravatarUrl(email: string, size: number = 32, defaultImage: string = 'identicon'): string {
  const trimmedEmail = email.trim().toLowerCase()
  const hash = crypto.MD5(trimmedEmail).toString()
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`
}

/**
 * Generate a Gravatar URL with additional options
 * @param email - The email address to generate a Gravatar for
 * @param options - Additional options for the Gravatar
 * @returns The Gravatar URL
 */
export function getGravatarUrlWithOptions(
  email: string,
  options: {
    size?: number
    defaultImage?: string
    rating?: 'g' | 'pg' | 'r' | 'x'
    forceDefault?: boolean
  } = {}
): string {
  const {
    size = 32,
    defaultImage = 'identicon',
    rating = 'g',
    forceDefault = false
  } = options

  const trimmedEmail = email.trim().toLowerCase()
  const hash = crypto.MD5(trimmedEmail).toString()

  const params = new URLSearchParams({
    s: size.toString(),
    d: defaultImage,
    r: rating
  })

  if (forceDefault) {
    params.set('f', 'y')
  }

  return `https://www.gravatar.com/avatar/${hash}?${params.toString()}`
}
