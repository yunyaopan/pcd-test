import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: projectTypes, error } = await supabase
    .from("project_types")
    .select(`
      id,
      name,
      price_percentage,
      quality_percentage,
      created_at,
      updated_at
    `)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projectTypes: projectTypes ?? [] });
}

export async function POST(req: NextRequest) {
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
    .insert({
      name: name.trim(),
      price_percentage,
      quality_percentage,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ 
        error: "A project type with this name already exists" 
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projectType }, { status: 201 });
}
