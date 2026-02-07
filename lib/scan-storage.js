import { getSupabaseAdminClient } from "@/lib/supabase";

export async function uploadScanImage({ userId, file, bucket, prefix }) {
  if (!file) {
    throw new Error("No file provided");
  }

  const supabase = getSupabaseAdminClient();
  const safePrefix = prefix || "scans";
  const safeBucket = bucket || "scan-uploads";

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileExt = file.name?.split(".").pop() || "jpg";
  const filePath = `${safePrefix}/${userId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(safeBucket)
    .upload(filePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(safeBucket)
    .createSignedUrl(filePath, 60);

  if (signedError) {
    await supabase.storage.from(safeBucket).remove([filePath]);
    throw new Error(`Supabase signed URL failed: ${signedError.message}`);
  }

  const signedUrl = signedData?.signedUrl;
  if (!signedUrl) {
    await supabase.storage.from(safeBucket).remove([filePath]);
    throw new Error("Supabase signed URL missing");
  }

  const cleanup = async () => {
    await supabase.storage.from(safeBucket).remove([filePath]);
  };

  return { signedUrl, cleanup };
}
