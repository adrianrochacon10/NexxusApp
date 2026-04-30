"use server"

import { z } from "zod"
import { v4 as uuid } from "uuid"
import { createSignedUploadUrl } from "@/lib/cloudflare/r2"

const signedUploadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().startsWith("image/"),
})

export async function generarURLFirmaSubida(input: z.infer<typeof signedUploadSchema>) {
  const values = signedUploadSchema.parse(input)
  const extension = values.fileName.split(".").pop() ?? "webp"
  const key = `productos/${uuid()}.${extension}`

  return createSignedUploadUrl(key, values.contentType)
}
