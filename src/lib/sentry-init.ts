import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
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

      beforeSend(event: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.type === "RequestBodyTooLargeError") {
            return null;
          }
        }
        return event;
      },
    };

    Sentry.init(config);
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
