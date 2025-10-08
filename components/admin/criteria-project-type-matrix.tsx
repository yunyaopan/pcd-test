"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save } from "lucide-react";

interface ProjectType {
  id: string;
  name: string;
  price_percentage: number;
  quality_percentage: number;
}

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string | null;
  detailed_scoring_methodology: string | null;
}

interface ProjectTypeCriteriaConfig {
  id: string;
  project_type_id: string;
  evaluation_criteria_id: string;
  is_applicable: boolean;
  minimum_weight: number | null;
  default_weight: number | null;
}

interface CriteriaProjectTypeMatrixProps {
  onSuccess: () => void;
}

export function CriteriaProjectTypeMatrix({ onSuccess }: CriteriaProjectTypeMatrixProps) {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [configurations, setConfigurations] = useState<ProjectTypeCriteriaConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      // Load project types
      const projectTypesResponse = await fetch('/api/admin/project-types');
      if (!projectTypesResponse.ok) throw new Error('Failed to load project types');
      const { projectTypes } = await projectTypesResponse.json();
      setProjectTypes(projectTypes);

      // Load evaluation criteria
      const criteriaResponse = await fetch('/api/admin/evaluation-criteria');
      if (!criteriaResponse.ok) throw new Error('Failed to load evaluation criteria');
      const { evaluationCriteria } = await criteriaResponse.json();
      setCriteria(evaluationCriteria);

      // Load existing configurations
      const configResponse = await fetch('/api/admin/project-type-criteria-matrix');
      if (!configResponse.ok) throw new Error('Failed to load configurations');
      const { configurations } = await configResponse.json();
      setConfigurations(configurations);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getConfiguration(projectTypeId: string, criteriaId: string): ProjectTypeCriteriaConfig | null {
    return configurations.find(config => 
      config.project_type_id === projectTypeId && config.evaluation_criteria_id === criteriaId
    ) || null;
  }

  function updateConfiguration(projectTypeId: string, criteriaId: string, field: keyof Omit<ProjectTypeCriteriaConfig, 'id'>, value: boolean | number | null) {
    setConfigurations(prev => {
      const existing = prev.find(config => 
        config.project_type_id === projectTypeId && config.evaluation_criteria_id === criteriaId
      );
      
      if (existing) {
        return prev.map(config => 
          config.project_type_id === projectTypeId && config.evaluation_criteria_id === criteriaId
            ? { ...config, [field]: value }
            : config
        );
      } else {
        // Create new configuration
        return [...prev, {
          id: '', // Will be set by backend
          project_type_id: projectTypeId,
          evaluation_criteria_id: criteriaId,
          is_applicable: field === 'is_applicable' ? value as boolean : true,
          minimum_weight: field === 'minimum_weight' ? value as number : null,
          default_weight: field === 'default_weight' ? value as number : null,
        }];
      }
    });
  }

  async function saveConfigurations() {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/project-type-criteria-matrix', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configurations: configurations.map(config => ({
            project_type_id: config.project_type_id,
            evaluation_criteria_id: config.evaluation_criteria_id,
            is_applicable: config.is_applicable,
            minimum_weight: config.minimum_weight,
            default_weight: config.default_weight,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configurations');
      }

      alert('Configurations saved successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to save configurations:', error);
      alert(`Failed to save configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Criteria-Project Type Matrix</h3>
          <p className="text-gray-600">Configure which criteria apply to each project type and set weights</p>
        </div>
        <Button onClick={saveConfigurations} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Matrix'}
        </Button>
      </div>

      {/* Matrix Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-900 min-w-[200px] sticky left-0 bg-gray-50 z-10">
                    Criteria
                  </th>
                  {projectTypes.map((projectType) => (
                    <th key={projectType.id} className="text-center p-4 font-medium text-gray-900 min-w-[150px]">
                      <div className="text-sm">{projectType.name}</div>
                      <div className="text-xs text-gray-500">
                        {projectType.price_percentage}% Price / {projectType.quality_percentage}% Quality
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((criterion) => (
                  <tr key={criterion.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 sticky left-0 bg-white z-10">
                      <div className="font-medium text-gray-900">{criterion.name}</div>
                      {criterion.description && (
                        <div className="text-xs text-gray-500 mt-1">{criterion.description}</div>
                      )}
                    </td>
                    {projectTypes.map((projectType) => {
                      const config = getConfiguration(projectType.id, criterion.id);
                      const isApplicable = config?.is_applicable || false;
                      
                      return (
                        <td key={`${projectType.id}-${criterion.id}`} className="p-4 text-center">
                          <div className="space-y-2">
                            {/* Applicable Checkbox */}
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isApplicable}
                                onChange={(e) => updateConfiguration(projectType.id, criterion.id, 'is_applicable', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                            
                            {/* Weight Inputs */}
                            {isApplicable && (
                              <div className="space-y-1">
                                <div>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={config?.minimum_weight || ''}
                                    onChange={(e) => updateConfiguration(projectType.id, criterion.id, 'minimum_weight', parseFloat(e.target.value) || null)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Min %"
                                    title="Minimum Weight"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={config?.default_weight || ''}
                                    onChange={(e) => updateConfiguration(projectType.id, criterion.id, 'default_weight', parseFloat(e.target.value) || null)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Default %"
                                    title="Default Weight"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="text-sm text-gray-600">
        <p><strong>Legend:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><strong>Min %:</strong> Minimum weight percentage for this criteria</li>
          <li><strong>Default %:</strong> Default weight percentage for this criteria</li>
          <li>Check the box to make a criteria applicable to a project type</li>
        </ul>
      </div>

      {criteria.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No evaluation criteria found. Create evaluation criteria first.</p>
        </div>
      )}

      {projectTypes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No project types found. Create project types first.</p>
        </div>
      )}
    </div>
  );
}

