import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: evaluationCriteria, error } = await supabase
    .from("evaluation_criteria")
    .select(`
      id,
      name,
      description,
      detailed_scoring_methodology,
      created_at,
      updated_at
    `)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ evaluationCriteria: evaluationCriteria ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  
  const { name, description, detailed_scoring_methodology } = body;

  // Validation
  if (!name) {
    return NextResponse.json({ 
      error: "Name is required" 
    }, { status: 400 });
  }

  if (!detailed_scoring_methodology) {
    return NextResponse.json({ 
      error: "Detailed scoring methodology is required" 
    }, { status: 400 });
  }

  const { data: evaluationCriteria, error } = await supabase
    .from("evaluation_criteria")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      detailed_scoring_methodology: detailed_scoring_methodology.trim(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ 
        error: "An evaluation criteria with this name already exists" 
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ evaluationCriteria }, { status: 201 });
}
