export const environment = {
  production: true,

  // Not read in production: `production: true` already enables the service
  // worker. Present so both environment files have the same shape.
  enableServiceWorker: false,

  // Demo mode must never be enabled by a production build.
  enableDemoTools: false,

  sentryDsn: '${SENTRY_DSN}',
  sentryRelease: '${SENTRY_RELEASE}',
  sentryDist: '${SENTRY_DIST}',
};
