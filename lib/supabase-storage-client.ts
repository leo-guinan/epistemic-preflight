// Client-side Supabase Storage utilities for direct uploads
// This bypasses Vercel's 4.5MB request limit by uploading directly to Supabase
import { createClient } from "@/lib/supabase/client";

export async function uploadFileDirectly(
  bucket: string,
  path: string,
  file: File
): Promise<{ path: string }> {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from Supabase Storage upload");
  }

  return data;
}

