import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform"
import { Schema } from "effect"
import { HealthStatus } from "../domain/schemas.js"

// Health endpoint group
const HealthGroup = HttpApiGroup.make("health")
  .add(
    HttpApiEndpoint.get("check", "/api/health")
      .addSuccess(HealthStatus)
  )

// Main API definition
export class Api extends HttpApi.make("api")
  .add(HealthGroup) {}
