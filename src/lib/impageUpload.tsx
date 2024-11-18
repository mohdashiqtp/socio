import { supabase } from "./supabase";

;

// handles image uploads to supabase storage
export const uploadImageToSupabase = async (file: File): Promise<string> => {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    // max file size is 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error("File size too large (max 5MB)");
    }

    // generate random filename to avoid conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data, error } = await supabase.storage
      .from("post-images")
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw error;
    }

    if (!data?.path) {
      throw new Error("Upload successful but no path returned");
    }

    // grab the public url for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from("post-images")
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadImageToSupabase:", error);
    throw error;
  }
};