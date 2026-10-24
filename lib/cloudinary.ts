import { createHash } from "node:crypto";

export function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Creates a signed upload payload so the browser can upload straight to Cloudinary
 * without the API secret ever leaving the server.
 */
export function signUpload(folder: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const secret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${secret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    apiKey,
    timestamp,
    folder,
    signature,
  };
}
