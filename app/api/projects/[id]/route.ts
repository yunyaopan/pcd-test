import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      document_no,
      reference_no,
      publication_date,
      closing_date,
      description,
      suppliers_count,
      status,
      created_at,
      evaluation_approach_id,
      tender_submissions (
        id,
        schedule_of_rates_no,
        trading_partner_reference_no,
        supplier_name,
        response_no,
        schedule_of_rates_description,
        percentage_adjustment,
        percentage_sign,
        entry_date,
        supplier_remarks
      ),
      evaluation_approaches (
        id,
        name,
        price_percentage,
        safety_percentage,
        technical_percentage,
        technical_criteria
      )
    `)
    .eq("id", projectId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
