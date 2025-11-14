import * as Sentry from '@sentry/tanstackstart-react'

const dsn = process.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN
const environment = process.env.NODE_ENV || 'development'

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
  })
} else {
  console.warn('Sentry DSN not configured. Server-side error tracking disabled.')
}

