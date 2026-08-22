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

      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      beforeSend(event: unknown) {
        if (typeof event === "object" && event !== null && "exception" in event) {
          const exc = (event as Record<string, unknown>).exception;
          if (exc && typeof exc === "object" && "values" in exc) {
            const values = (exc as Record<string, unknown>).values;
            if (Array.isArray(values) && values[0]) {
              const error = values[0] as Record<string, unknown>;
              if (error.type === "RequestBodyTooLargeError") {
                return null;
              }
            }
          }
        }
        return event;
      },
    });
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(error);
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, level);
}
