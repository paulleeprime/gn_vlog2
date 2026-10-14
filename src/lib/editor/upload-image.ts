import { createClient } from "@/lib/supabase/client";
import {
  POST_IMAGE_BUCKET,
  POST_IMAGE_MAX_BYTES,
  POST_IMAGE_TYPES,
} from "./content";

export async function uploadPostImage(file: File, userId: string) {
  if (!POST_IMAGE_TYPES.includes(file.type)) {
    throw new Error("PNG, JPG, GIF, WEBP 이미지만 올릴 수 있습니다.");
  }
  if (file.size > POST_IMAGE_MAX_BYTES) {
    throw new Error("이미지는 5MB 이하만 올릴 수 있습니다.");
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error("이미지 업로드에 실패했습니다.");

  return supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
