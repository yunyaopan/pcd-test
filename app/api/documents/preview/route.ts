import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import mammoth from "mammoth";

interface TenderSubmission {
  schedule_of_rates_no: string;
  trading_partner_reference_no: string;
  supplier_name: string;
  response_no: string;
  schedule_of_rates_description: string | null;
  percentage_adjustment: number | null;
  percentage_sign: string | null;
  entry_date: string | null;
  supplier_remarks: string | null;
}

function generateTenderSubmissionsTable(submissions: TenderSubmission[]): string {
  if (!submissions || submissions.length === 0) {
    return "<p>No tender submissions available.</p>";
  }

  const tableHeaders = [
    "Schedule Of Rates No.",
    "Trading Partner Reference No.",
    "Supplier Name",
    "Response No.",
    "Schedule of Rates Description",
    "Percentage Adjustment",
    "Percentage Sign",
    "Entry Date",
    "Supplier Remarks"
  ];

  let tableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          ${tableHeaders.map(header => `<th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  submissions.forEach(submission => {
    tableHtml += `
      <tr>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.schedule_of_rates_no || ''}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.trading_partner_reference_no || ''}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.supplier_name || ''}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.response_no || ''}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.schedule_of_rates_description || ''}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.percentage_adjustment || ''}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.percentage_sign || ''}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.entry_date || ''}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.supplier_remarks || ''}</td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  return tableHtml;
}

function mergeTemplate(text: string, params: Record<string, unknown>): string {
  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    const path = String(key);
    const value = path.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, params);
    return value == null ? "" : String(value);
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { templateId, projectId } = await req.json();
  if (!templateId || !projectId) {
    return NextResponse.json({ error: "templateId and projectId are required" }, { status: 400 });
  }

  const { data: template, error: tErr } = await supabase
    .from("templates")
    .select("id,name,template_text,storage_path")
    .eq("id", templateId)
    .single();
  if (tErr || !template) return NextResponse.json({ error: tErr?.message || "Template not found" }, { status: 404 });

  const { data: project, error: pErr } = await supabase
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
    .eq("id", projectId)
    .single();
  if (pErr || !project) return NextResponse.json({ error: pErr?.message || "Project not found" }, { status: 404 });

  let templateText = template.template_text || "";
  
  // If no template_text but has storage_path, try to read and parse the file
  if (!templateText && template.storage_path) {
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("templates")
        .download(template.storage_path);
      
      if (downloadError) {
        return NextResponse.json({ error: `Failed to download file: ${downloadError.message}` }, { status: 500 });
      }
      
      // Convert blob to buffer for mammoth
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Parse Word document using mammoth
      const result = await mammoth.extractRawText({ buffer });
      templateText = result.value;
      
      // If parsing failed or no text extracted, show error
      if (!templateText || templateText.trim() === "") {
        return NextResponse.json({ 
          error: "Could not extract text from the uploaded document. Please ensure it's a valid Word document." 
        }, { status: 400 });
      }
    } catch (error) {
      console.error("Error parsing Word document:", error);
      return NextResponse.json({ 
        error: "Failed to parse Word document. Please ensure it's a valid .docx file." 
      }, { status: 500 });
    }
  }

  const paramObject = { 
    customer: { Name: project.name },
    project: {
      document_no: project.document_no,
      reference_no: project.reference_no,
      publication_date: project.publication_date,
      closing_date: project.closing_date,
      description: project.description,
      suppliers_count: project.suppliers_count
    },
    tender_submissions_table: generateTenderSubmissionsTable(project.tender_submissions || [])
  } as Record<string, unknown>;
  const merged = mergeTemplate(templateText, paramObject);

  return NextResponse.json({ preview: { templateName: template.name, projectName: project.name, content: merged } });
}


