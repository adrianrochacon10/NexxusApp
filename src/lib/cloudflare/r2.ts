import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export function createR2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null
  }

  return new S3Client({
    region:   "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })
}

export async function createSignedUploadUrl(key: string, contentType: string) {
  const client = createR2Client()
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  const publicUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL

  if (!client || !bucket || !publicUrl) {
    return {
      signedUrl: "",
      publicUrl: "",
      configured: false,
    }
  }

  const command = new PutObjectCommand({
    Bucket:      bucket,
    Key:         key,
    ContentType: contentType,
  })

  const signedUrl = await getSignedUrl(client, command, { expiresIn: 300 })

  return {
    signedUrl,
    publicUrl: `${publicUrl.replace(/\/$/, "")}/${key}`,
    configured: true,
  }
}

export async function deleteR2Object(publicUrlOrKey: string) {
  const client = createR2Client()
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  const publicBase = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL

  if (!client || !bucket) return

  // Extraer el key desde la URL pública o usarlo directo
  const key = publicBase
    ? publicUrlOrKey.replace(publicBase.replace(/\/$/, "") + "/", "")
    : publicUrlOrKey

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
