export type AppErrorCode =
  | "CONFIGURATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR"

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly status: number
  readonly expose: boolean

  constructor(code: AppErrorCode, message: string, status = 500, expose = true) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.status = status
    this.expose = expose
  }
}

