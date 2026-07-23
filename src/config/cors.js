export function getAllowedOrigins() {
  const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return Array.from(
    new Set([
      ...configuredOrigins,
      'https://contest-hub-client-bmor.vercel.app',
      'https://contest-hub-client-bmor-ibq73jgq9-samia-alam-oishis-projects.vercel.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]),
  )
}

function isAllowedVercelPreview(origin) {
  try {
    const url = new URL(origin)
    return url.protocol === 'https:' && /^contest-hub-client/.test(url.hostname) && url.hostname.endsWith('.vercel.app')
  } catch {
    return false
  }
}

export function corsOptions() {
  const allowedOrigins = getAllowedOrigins()

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isAllowedVercelPreview(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }
}
