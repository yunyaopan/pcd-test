import { NextResponse } from "next/server";
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
      project_type_evaluation_criteria (
        id,
        is_applicable,
        minimum_weight,
        default_weight,
        evaluation_criteria (
          id,
          name,
          description
        )
      )
    `)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter to only include applicable criteria
  const projectTypesWithApplicableCriteria = projectTypes?.map(pt => ({
    ...pt,
    project_type_evaluation_criteria: pt.project_type_evaluation_criteria?.filter(ptec => ptec.is_applicable) || []
  })) || [];

  return NextResponse.json({ projectTypes: projectTypesWithApplicableCriteria });
}
