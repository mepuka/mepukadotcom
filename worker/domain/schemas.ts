import { Schema } from "effect"

// Health check response
export class HealthStatus extends Schema.Class<HealthStatus>("HealthStatus")({
  status: Schema.Literal("ok", "error"),
  timestamp: Schema.DateTimeUtc,
}) {}

// Generic API error
export class ApiError extends Schema.TaggedError<ApiError>()("ApiError", {
  message: Schema.String,
  code: Schema.optional(Schema.String),
}) {}
