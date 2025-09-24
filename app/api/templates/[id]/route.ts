import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: templateId } = await params;

  if (!templateId) {
    return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("templates")
    .select("id,name,storage_path,template_text,created_at")
    .eq("id", templateId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: templateId } = await params;
  const body = await req.json();

  if (!templateId) {
    return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
  }

  const { name, template_text } = body;

  if (!name) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("templates")
    .update({
      name,
      template_text,
    })
    .eq("id", templateId)
    .select("id,name,storage_path,template_text,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: templateId } = await params;

  if (!templateId) {
    return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
  }

  // First, get the template to check if it has a storage file
  const { data: template, error: fetchError } = await supabase
    .from("templates")
    .select("storage_path")
    .eq("id", templateId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Delete the file from storage if it exists
  if (template.storage_path) {
    const { error: storageError } = await supabase.storage
      .from("templates")
      .remove([template.storage_path]);
    
    if (storageError) {
      console.error("Failed to delete storage file:", storageError);
      // Continue with database deletion even if storage deletion fails
    }
  }

  // Delete the template from database
  const { error: deleteError } = await supabase
    .from("templates")
    .delete()
    .eq("id", templateId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
