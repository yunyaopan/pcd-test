import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface TenderSubmissionInput {
  scheduleOfRatesNo: string;
  tradingPartnerReferenceNo: string;
  supplierName: string;
  responseNo: string;
  scheduleOfRatesDescription: string;
  percentageAdjustment: number;
  percentageSign: string;
  entryDate: string;
  supplierRemarks: string;
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
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
      project_type_id,
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
      project_types (
        id,
        name,
        price_percentage,
        quality_percentage
      ),
      project_evaluation_criteria_weights (
        id,
        weight,
        evaluation_criteria (
          id,
          name,
          description
        )
      )
    `)
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
    suppliers_count,
    status,
    project_type_id,
    evaluation_criteria_weights,
    tender_submissions
  } = body;

  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  if (!project_type_id) {
    return NextResponse.json({ error: "Project type is required" }, { status: 400 });
  }

  // Get project type to validate weights
  const { data: projectType, error: projectTypeError } = await supabase
    .from("project_types")
    .select("quality_percentage")
    .eq("id", project_type_id)
    .single();

  if (projectTypeError) {
    return NextResponse.json({ error: "Invalid project type" }, { status: 400 });
  }

  // Validate evaluation criteria weights if provided
  if (evaluation_criteria_weights && Array.isArray(evaluation_criteria_weights)) {
    const totalWeight = evaluation_criteria_weights.reduce((sum, weight) => sum + (weight.weight || 0), 0);
    
    if (Math.abs(totalWeight - projectType.quality_percentage) > 0.01) {
      return NextResponse.json({ 
        error: `Total evaluation criteria weights must equal ${projectType.quality_percentage}%` 
      }, { status: 400 });
    }

    // Validate minimum weights
    for (const weightConfig of evaluation_criteria_weights) {
      const { data: typeCriteria } = await supabase
        .from("project_type_evaluation_criteria")
        .select("minimum_weight")
        .eq("project_type_id", project_type_id)
        .eq("evaluation_criteria_id", weightConfig.evaluation_criteria_id)
        .single();

      if (typeCriteria?.minimum_weight && weightConfig.weight < typeCriteria.minimum_weight) {
        return NextResponse.json({ 
          error: `Weight for criteria must be at least ${typeCriteria.minimum_weight}%` 
        }, { status: 400 });
      }
    }
  }

  // First, create the project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name,
      document_no,
      reference_no,
      publication_date,
      closing_date,
      description,
      suppliers_count: suppliers_count || 0,
      status: status || 'submit evaluation criteria',
      project_type_id,
    })
    .select("id,name,document_no,reference_no,publication_date,closing_date,description,suppliers_count,status,created_at")
    .single();

  if (projectError) return NextResponse.json({ error: projectError.message }, { status: 500 });

  // Then, create evaluation criteria weights if provided
  if (evaluation_criteria_weights && evaluation_criteria_weights.length > 0) {
    const weightsData = evaluation_criteria_weights.map((weight: { evaluation_criteria_id: string; weight: number }) => ({
      project_id: project.id,
      evaluation_criteria_id: weight.evaluation_criteria_id,
      weight: weight.weight,
    }));

    const { error: weightsError } = await supabase
      .from("project_evaluation_criteria_weights")
      .insert(weightsData);

    if (weightsError) {
      console.error("Failed to insert evaluation criteria weights:", weightsError);
      // Continue anyway - project is created
    }
  }

  // Then, create tender submissions if any
  if (tender_submissions && tender_submissions.length > 0) {
    const submissionsData = tender_submissions.map((submission: TenderSubmissionInput) => ({
      project_id: project.id,
      schedule_of_rates_no: submission.scheduleOfRatesNo,
      trading_partner_reference_no: submission.tradingPartnerReferenceNo,
      supplier_name: submission.supplierName,
      response_no: submission.responseNo,
      schedule_of_rates_description: submission.scheduleOfRatesDescription,
      percentage_adjustment: submission.percentageAdjustment,
      percentage_sign: submission.percentageSign,
      entry_date: submission.entryDate,
      supplier_remarks: submission.supplierRemarks,
    }));

    const { error: submissionsError } = await supabase
      .from("tender_submissions")
      .insert(submissionsData);

    if (submissionsError) {
      console.error("Failed to insert tender submissions:", submissionsError);
      // Continue anyway - project is created
    }
  }

  return NextResponse.json({ project }, { status: 201 });
}


