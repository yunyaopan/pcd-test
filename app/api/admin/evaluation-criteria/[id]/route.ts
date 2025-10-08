import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return NextResponse.json({ error: "Evaluation criteria not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ evaluationCriteria });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      detailed_scoring_methodology: detailed_scoring_methodology.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return NextResponse.json({ error: "Evaluation criteria not found" }, { status: 404 });
    }
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ 
        error: "An evaluation criteria with this name already exists" 
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ evaluationCriteria });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Check if any projects are using this evaluation criteria
  const { data: projectWeights, error: checkError } = await supabase
    .from("project_evaluation_criteria_weights")
    .select("id")
    .eq("evaluation_criteria_id", id)
    .limit(1);

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  if (projectWeights && projectWeights.length > 0) {
    return NextResponse.json({ 
      error: "Cannot delete evaluation criteria that is being used by existing projects" 
    }, { status: 409 });
  }

  const { error } = await supabase
    .from("evaluation_criteria")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return NextResponse.json({ error: "Evaluation criteria not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Evaluation criteria deleted successfully" });
}
