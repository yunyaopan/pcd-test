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

interface EvaluationApproach {
  id: string;
  name: string;
  price_percentage: number;
  safety_percentage: number;
  technical_percentage: number;
  technical_criteria?: Record<string, string>;
}

function generateEvaluationCriteriaTable(evaluationApproach: EvaluationApproach | null, tenderSubmissions: TenderSubmission[] = []): string {
  if (!evaluationApproach) {
    return "<p>No evaluation criteria available.</p>";
  }

  // Generate header columns for tender submissions
  const submissionHeaders = tenderSubmissions.map((submission, index) => 
    `<th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; background-color: #f0f9ff;">${submission.supplier_name || `Supplier ${index + 1}`}</th>`
  ).join('');

  const tableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Criteria</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Percentage</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Scoring Details</th>
          ${submissionHeaders}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; color: #059669;">Price</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: #059669;">${evaluationApproach.price_percentage}%</td>
          <td style="border: 1px solid #ddd; padding: 12px; color: #6b7280;">Price-based evaluation</td>
          ${tenderSubmissions.map(() => '<td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #9ca3af;">-</td>').join('')}
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; color: #dc2626;">Safety</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: #dc2626;">${evaluationApproach.safety_percentage}%</td>
          <td style="border: 1px solid #ddd; padding: 12px; color: #6b7280;">Safety compliance evaluation</td>
          ${tenderSubmissions.map(() => '<td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #9ca3af;">-</td>').join('')}
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; color: #2563eb;">Technical</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: #2563eb;">${evaluationApproach.technical_percentage}%</td>
          <td style="border: 1px solid #ddd; padding: 12px;">
            ${evaluationApproach.technical_criteria ? 
              Object.entries(evaluationApproach.technical_criteria).map(([points, description]) => 
                `<div style="margin: 4px 0;"><strong style="color: #2563eb;">${points}:</strong> ${description}</div>`
              ).join('') : 
              '<span style="color: #6b7280;">Technical proposal evaluation</span>'
            }
          </td>
          ${tenderSubmissions.map(() => '<td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #9ca3af;">-</td>').join('')}
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Total</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">
            ${evaluationApproach.price_percentage + evaluationApproach.safety_percentage + evaluationApproach.technical_percentage}%
          </td>
          <td style="border: 1px solid #ddd; padding: 12px; color: #6b7280;">Complete evaluation criteria</td>
          ${tenderSubmissions.map(() => '<td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #9ca3af;">-</td>').join('')}
        </tr>
      </tbody>
    </table>
  `;

  return tableHtml;
}

function generateTenderSubmissionsTable(submissions: TenderSubmission[]): string {
  if (!submissions || submissions.length === 0) {
    return "<p>No tender submissions available.</p>";
  }

  // Sort by percentage adjustment (biggest to smallest)
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const aAdjustment = a.percentage_adjustment || 0;
    const bAdjustment = b.percentage_adjustment || 0;
    return bAdjustment - aAdjustment; // Descending order (biggest first)
  });

  const tableHeaders = [
    "S/N",
    "Name of Tenderer", 
    "Plus (+) / Minus (-) Percentum on Fixed Base Prices in the Fixed Schedule of Rates (%)"
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

  sortedSubmissions.forEach((submission, index) => {
    // Format percentage with proper sign
    const percentageAdjustment = submission.percentage_adjustment || 0;
    const percentageSign = submission.percentage_sign || '';
    
    // Convert sign to proper format: "Negative" -> "(-)", "Positive" -> "(+)"
    let formattedSign = '';
    if (percentageSign.toLowerCase() === 'negative') {
      formattedSign = '(-)';
    } else if (percentageSign.toLowerCase() === 'positive') {
      formattedSign = '(+)';
    } else {
      formattedSign = percentageSign; // Keep original if it's already formatted
    }
    
    const formattedPercentage = percentageAdjustment !== 0 
      ? `${formattedSign} ${Math.abs(percentageAdjustment)}%`
      : '0%';

    tableHtml += `
      <tr>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${submission.supplier_name || ''}</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${formattedPercentage}</td>
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
    tender_submissions_table: generateTenderSubmissionsTable(project.tender_submissions || []),
    evaluation_criteria_table: generateEvaluationCriteriaTable(
      Array.isArray(project.evaluation_approaches) 
        ? project.evaluation_approaches[0] 
        : project.evaluation_approaches, 
      project.tender_submissions || []
    )
  } as Record<string, unknown>;
  const merged = mergeTemplate(templateText, paramObject);

  return NextResponse.json({ preview: { templateName: template.name, projectName: project.name, content: merged } });
}


