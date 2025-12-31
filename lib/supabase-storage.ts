// Supabase Storage utilities for file uploads
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function uploadToSupabaseStorage(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
  }

  return data;
}

export async function downloadFromSupabaseStorage(
  bucket: string,
  path: string
): Promise<Buffer> {
  // Use service role client to bypass RLS (needed for temp bucket downloads)
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) {
    throw new Error(`Failed to download from Supabase Storage: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from Supabase Storage");
  }

  // Convert Blob to Buffer
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteFromSupabaseStorage(bucket: string, path: string) {
  // Use service role client to bypass RLS (needed for temp bucket deletions)
  const supabase = createServiceRoleClient();
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete from Supabase Storage: ${error.message}`);
  }
}

