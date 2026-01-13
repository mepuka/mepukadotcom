import { D1Client } from "@effect/sql-d1"
import { Effect, Layer } from "effect"
import { Config } from "./Config.js"

// Database service layer using D1
export const DatabaseLive = Layer.effect(
  D1Client.D1Client,
  Effect.gen(function* () {
    const config = yield* Config
    return yield* D1Client.make({ db: config.env.DB })
  })
)
