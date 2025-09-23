import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("templates")
    .select("id,name,storage_path,template_text,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const formData = await req.formData();

  const name = String(formData.get("name") || "").trim();
  const templateText = (formData.get("template_text") as string) || null;
  const file = formData.get("file") as File | null;

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  let storagePath: string | null = null;
  if (file) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const fileExt = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `public/${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("templates")
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
    storagePath = path;
  }

  const { data, error } = await supabase
    .from("templates")
    .insert({ name, storage_path: storagePath, template_text: templateText })
    .select("id,name,storage_path,template_text,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}


