import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: projectType, error } = await supabase
    .from("project_types")
    .select(`
      id,
      name,
      price_percentage,
      quality_percentage,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return NextResponse.json({ error: "Project type not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projectType });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();
  
  const { name, price_percentage, quality_percentage } = body;

  // Validation
  if (!name || !price_percentage || !quality_percentage) {
    return NextResponse.json({ 
      error: "Name, price_percentage, and quality_percentage are required" 
    }, { status: 400 });
  }

  if (price_percentage + quality_percentage !== 100) {
    return NextResponse.json({ 
      error: "Price and quality percentages must sum to 100" 
    }, { status: 400 });
  }

  if (price_percentage <= 0 || price_percentage >= 100 || quality_percentage <= 0 || quality_percentage >= 100) {
    return NextResponse.json({ 
      error: "Percentages must be between 0 and 100" 
    }, { status: 400 });
  }

  const { data: projectType, error } = await supabase
    .from("project_types")
    .update({
      name: name.trim(),
      price_percentage,
      quality_percentage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return NextResponse.json({ error: "Project type not found" }, { status: 404 });
    }
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ 
        error: "A project type with this name already exists" 
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projectType });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Check if any projects are using this project type
  const { data: projects, error: checkError } = await supabase
    .from("projects")
    .select("id")
    .eq("project_type_id", id)
    .limit(1);

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  if (projects && projects.length > 0) {
    return NextResponse.json({ 
      error: "Cannot delete project type that is being used by existing projects" 
    }, { status: 409 });
  }

  const { error } = await supabase
    .from("project_types")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return NextResponse.json({ error: "Project type not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Project type deleted successfully" });
}
