const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const config = {
  apiBaseUrl: API_BASE_URL,
  endpoints: {
    dogs: `${API_BASE_URL}/api/dogs`,
    clubs: `${API_BASE_URL}/api/clubs`,
    owners: `${API_BASE_URL}/api/owners`,
    practices: `${API_BASE_URL}/api/practices`
  }
}
