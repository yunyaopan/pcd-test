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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const body = await req.json();
  
  const {
    document_no,
    reference_no,
    publication_date,
    closing_date,
    description,
    suppliers_count,
    tender_submissions
  } = body;

  // First, update the project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .update({
      document_no,
      reference_no,
      publication_date,
      closing_date,
      description,
      suppliers_count: suppliers_count || 0,
    })
    .eq("id", projectId)
    .select("id,name,document_no,reference_no,publication_date,closing_date,description,suppliers_count,status,created_at")
    .single();

  if (projectError) return NextResponse.json({ error: projectError.message }, { status: 500 });

  // Delete existing tender submissions and insert new ones
  if (tender_submissions && tender_submissions.length > 0) {
    // Delete existing tender submissions
    const { error: deleteError } = await supabase
      .from("tender_submissions")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      console.error("Failed to delete existing tender submissions:", deleteError);
    }

    // Insert new tender submissions
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
    
    const submissionsData = tender_submissions.map((submission: TenderSubmissionInput) => ({
      project_id: projectId,
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
      // Continue anyway - project is updated
    }
  }

  return NextResponse.json({ project }, { status: 200 });
}
