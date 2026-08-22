import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      replaySessionSampleRate: 0.1,
      replayOnErrorSampleRate: 1.0,

      beforeSend(event) {
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.type === "RequestBodyTooLargeError") {
            return null;
          }
        }
        return event;
      },
    });
  }
}

export function captureException(error: unknown, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(error);
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, level);
}
