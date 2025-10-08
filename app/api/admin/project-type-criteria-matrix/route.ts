import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: configurations, error } = await supabase
    .from("project_type_evaluation_criteria")
    .select(`
      id,
      project_type_id,
      evaluation_criteria_id,
      is_applicable,
      minimum_weight,
      default_weight,
      created_at
    `)
    .order("project_type_id, evaluation_criteria_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configurations: configurations ?? [] });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  
  const { configurations } = body;

  if (!Array.isArray(configurations)) {
    return NextResponse.json({ 
      error: "configurations must be an array" 
    }, { status: 400 });
  }

  // Validate each configuration
  for (const config of configurations) {
    if (!config.project_type_id || !config.evaluation_criteria_id) {
      return NextResponse.json({ 
        error: "Each configuration must have project_type_id and evaluation_criteria_id" 
      }, { status: 400 });
    }
    if (config.minimum_weight !== undefined && config.minimum_weight !== null) {
      if (config.minimum_weight < 0 || config.minimum_weight > 100) {
        return NextResponse.json({ 
          error: "Minimum weight must be between 0 and 100" 
        }, { status: 400 });
      }
    }
    if (config.default_weight !== undefined && config.default_weight !== null) {
      if (config.default_weight < 0 || config.default_weight > 100) {
        return NextResponse.json({ 
          error: "Default weight must be between 0 and 100" 
        }, { status: 400 });
      }
    }
  }

  // Delete all existing configurations
  const { error: deleteError } = await supabase
    .from("project_type_evaluation_criteria")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Insert new configurations
  if (configurations.length > 0) {
    const configsToInsert = configurations.map(config => ({
      project_type_id: config.project_type_id,
      evaluation_criteria_id: config.evaluation_criteria_id,
      is_applicable: config.is_applicable !== undefined ? config.is_applicable : true,
      minimum_weight: config.minimum_weight || null,
      default_weight: config.default_weight || null,
    }));

    const { data: newConfigurations, error: insertError } = await supabase
      .from("project_type_evaluation_criteria")
      .insert(configsToInsert)
      .select(`
        id,
        project_type_id,
        evaluation_criteria_id,
        is_applicable,
        minimum_weight,
        default_weight,
        created_at
      `);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ configurations: newConfigurations });
  }

  return NextResponse.json({ configurations: [] });
}

