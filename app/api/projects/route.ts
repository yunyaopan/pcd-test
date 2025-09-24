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
    evaluation_approach_id,
    tender_submissions
  } = body;

  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
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
      evaluation_approach_id,
    })
    .select("id,name,document_no,reference_no,publication_date,closing_date,description,suppliers_count,status,created_at")
    .single();

  if (projectError) return NextResponse.json({ error: projectError.message }, { status: 500 });

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


