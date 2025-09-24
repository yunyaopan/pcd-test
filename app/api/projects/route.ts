import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,document_no,reference_no,publication_date,closing_date,description,suppliers_count,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  
  const {
    name,
    document_no,
    reference_no,
    publication_date,
    closing_date,
    description,
    suppliers_count
  } = body;

  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      document_no,
      reference_no,
      publication_date,
      closing_date,
      description,
      suppliers_count: suppliers_count || 0,
    })
    .select("id,name,document_no,reference_no,publication_date,closing_date,description,suppliers_count,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}


