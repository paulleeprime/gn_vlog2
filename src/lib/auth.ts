import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getViewer = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio")
    .eq("id", claims.sub)
    .single();

  return { id: claims.sub, email: claims.email, profile };
});

export async function requireViewerWithUsername() {
  const viewer = await getViewer();
  if (!viewer) redirect("/?error=login_required");
  const username = viewer.profile?.username;
  if (!username) redirect("/onboarding");
  return { ...viewer, username };
}
