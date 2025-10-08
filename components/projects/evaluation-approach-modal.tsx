"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Check, ArrowLeft, ArrowRight } from "lucide-react";

interface ProjectType {
  id: string;
  name: string;
  price_percentage: number;
  quality_percentage: number;
  project_type_evaluation_criteria: ProjectTypeEvaluationCriteria[];
}

interface ProjectTypeEvaluationCriteria {
  id: string;
  is_applicable: boolean;
  minimum_weight: number | null;
  default_weight: number | null;
  evaluation_criteria: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface ProjectTypeSelectionModalProps {
  onClose: () => void;
  onProjectCreated: () => void;
}

export function ProjectTypeSelectionModal({ onClose, onProjectCreated }: ProjectTypeSelectionModalProps) {
  const [step, setStep] = useState<'type-selection' | 'weight-configuration'>('type-selection');
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
  const [projectName, setProjectName] = useState("");
  const [criteriaWeights, setCriteriaWeights] = useState<Record<string, number>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjectTypes();
  }, []);

  async function loadProjectTypes() {
    try {
      const response = await fetch('/api/project-types');
      if (!response.ok) throw new Error('Failed to load project types');
      const { projectTypes } = await response.json();
      setProjectTypes(projectTypes);
    } catch (error) {
      console.error('Failed to load project types:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleProjectTypeSelect(projectType: ProjectType) {
    setSelectedProjectType(projectType);
    
    // Initialize criteria weights with default values
    const initialWeights: Record<string, number> = {};
    projectType.project_type_evaluation_criteria.forEach(criteria => {
      if (criteria.default_weight !== null) {
        initialWeights[criteria.evaluation_criteria.id] = criteria.default_weight;
      }
    });
    setCriteriaWeights(initialWeights);
    
    setStep('weight-configuration');
  }

  function handleWeightChange(criteriaId: string, weight: number) {
    setCriteriaWeights(prev => ({
      ...prev,
      [criteriaId]: weight
    }));
  }

  function getTotalWeight(): number {
    return Object.values(criteriaWeights).reduce((sum, weight) => sum + (weight || 0), 0);
  }

  function getRequiredWeight(): number {
    return selectedProjectType?.quality_percentage || 0;
  }

  function isWeightValid(): boolean {
    const total = getTotalWeight();
    const required = getRequiredWeight();
    return Math.abs(total - required) < 0.01;
  }

  function getWeightValidationMessage(): string {
    const total = getTotalWeight();
    const required = getRequiredWeight();
    const difference = required - total;
    
    if (Math.abs(difference) < 0.01) {
      return "✓ Weights are valid";
    } else if (difference > 0) {
      return `Need ${difference.toFixed(1)}% more to reach ${required}%`;
    } else {
      return `Remove ${Math.abs(difference).toFixed(1)}% to reach ${required}%`;
    }
  }

  function isMinimumWeightViolated(criteriaId: string, weight: number): boolean {
    if (!selectedProjectType) return false;
    
    const criteria = selectedProjectType.project_type_evaluation_criteria.find(
      c => c.evaluation_criteria.id === criteriaId
    );
    
    return criteria?.minimum_weight !== null && criteria?.minimum_weight !== undefined && 
           weight < criteria.minimum_weight;
  }

  async function handleCreateProject() {
    if (!selectedProjectType || !projectName.trim()) {
      alert("Please select a project type and enter a project name");
      return;
    }

    if (!isWeightValid()) {
      alert("Please ensure all weights sum to the required percentage");
      return;
    }

    setIsCreating(true);
    try {
      const evaluation_criteria_weights = Object.entries(criteriaWeights).map(([criteriaId, weight]) => ({
        evaluation_criteria_id: criteriaId,
        weight: weight
      }));

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName.trim(),
          project_type_id: selectedProjectType.id,
          evaluation_criteria_weights,
          status: 'submit evaluation criteria',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      onProjectCreated();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="p-6 text-center">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
            <p>Loading project types...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-4">
            {step === 'weight-configuration' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('type-selection')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <h2 className="text-xl font-semibold">
              {step === 'type-selection' ? 'Create New Project' : 'Configure Evaluation Criteria'}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {step === 'type-selection' && (
            <>
              {/* Project Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>

              {/* Project Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Project Type *
                </label>
                <div className="space-y-3">
                  {projectTypes.map((projectType) => (
                    <Card
                      key={projectType.id}
                      className="cursor-pointer transition-all hover:bg-gray-50"
                      onClick={() => handleProjectTypeSelect(projectType)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{projectType.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-gray-900">Price</div>
                            <div className="text-2xl font-bold text-green-600">
                              {projectType.price_percentage}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">Quality</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {projectType.quality_percentage}%
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-center text-sm text-gray-500">
                          Total: {projectType.price_percentage + projectType.quality_percentage}%
                        </div>
                        
                        {/* Applicable Criteria Preview */}
                        {projectType.project_type_evaluation_criteria.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Applicable Evaluation Criteria ({projectType.project_type_evaluation_criteria.length}):
                            </div>
                            <div className="space-y-1">
                              {projectType.project_type_evaluation_criteria.slice(0, 3).map((criteria) => (
                                <div key={criteria.evaluation_criteria.id} className="text-xs text-gray-600">
                                  • {criteria.evaluation_criteria.name}
                                </div>
                              ))}
                              {projectType.project_type_evaluation_criteria.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{projectType.project_type_evaluation_criteria.length - 3} more...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 'weight-configuration' && selectedProjectType && (
            <>
              {/* Project Type Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">{selectedProjectType.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-900">Price</div>
                    <div className="text-xl font-bold text-green-600">
                      {selectedProjectType.price_percentage}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-900">Quality</div>
                    <div className="text-xl font-bold text-blue-600">
                      {selectedProjectType.quality_percentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Weight Configuration */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Configure Evaluation Criteria Weights</h3>
                  <div className={`text-sm font-medium ${
                    isWeightValid() ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {getWeightValidationMessage()}
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedProjectType.project_type_evaluation_criteria.map((criteria) => (
                    <div key={criteria.evaluation_criteria.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {criteria.evaluation_criteria.name}
                          </h4>
                          {criteria.evaluation_criteria.description && (
                            <p className="text-sm text-gray-600">
                              {criteria.evaluation_criteria.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            Min: {criteria.minimum_weight || 0}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={criteriaWeights[criteria.evaluation_criteria.id] || 0}
                          onChange={(e) => handleWeightChange(criteria.evaluation_criteria.id, parseFloat(e.target.value) || 0)}
                          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isMinimumWeightViolated(criteria.evaluation_criteria.id, criteriaWeights[criteria.evaluation_criteria.id] || 0)
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      
                      {isMinimumWeightViolated(criteria.evaluation_criteria.id, criteriaWeights[criteria.evaluation_criteria.id] || 0) && (
                        <div className="mt-2 text-sm text-red-600">
                          ⚠️ Weight must be at least {criteria.minimum_weight}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Current Total</span>
                    <span>{getTotalWeight().toFixed(1)}% / {getRequiredWeight()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isWeightValid() ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((getTotalWeight() / getRequiredWeight()) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {step === 'type-selection' ? (
            <Button
              onClick={() => setStep('weight-configuration')}
              disabled={!selectedProjectType || !projectName.trim()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateProject}
              disabled={!isWeightValid() || isCreating}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
