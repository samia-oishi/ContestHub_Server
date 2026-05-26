export function getAllowedOrigins() {
  const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return Array.from(
    new Set([
      ...configuredOrigins,
      'https://contest-hub-client-bmor.vercel.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]),
  )
}

export function corsOptions() {
  const allowedOrigins = getAllowedOrigins()

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }
}
