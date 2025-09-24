"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Check } from "lucide-react";

interface EvaluationApproach {
  id: string;
  name: string;
  price_percentage: number;
  safety_percentage: number;
  technical_percentage: number;
  technical_criteria: Record<string, string> | null;
}

interface EvaluationApproachModalProps {
  onClose: () => void;
  onProjectCreated: () => void;
}

export function EvaluationApproachModal({ onClose, onProjectCreated }: EvaluationApproachModalProps) {
  const [selectedApproach, setSelectedApproach] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [approaches, setApproaches] = useState<EvaluationApproach[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvaluationApproaches();
  }, []);

  async function loadEvaluationApproaches() {
    try {
      const response = await fetch('/api/evaluation-approaches');
      if (!response.ok) throw new Error('Failed to load evaluation approaches');
      const { approaches } = await response.json();
      setApproaches(approaches);
    } catch (error) {
      console.error('Failed to load evaluation approaches:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateProject() {
    if (!selectedApproach || !projectName.trim()) {
      alert("Please select an evaluation approach and enter a project name");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName.trim(),
          evaluation_approach_id: selectedApproach,
          status: 'submit evaluation criteria',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      onProjectCreated();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
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
            <p>Loading evaluation approaches...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
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

          {/* Evaluation Approach Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Evaluation Approach *
            </label>
            <div className="space-y-3">
              {approaches.map((approach) => (
                <Card
                  key={approach.id}
                  className={`cursor-pointer transition-all ${
                    selectedApproach === approach.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedApproach(approach.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{approach.name}</CardTitle>
                      {selectedApproach === approach.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">Price</div>
                        <div className="text-2xl font-bold text-green-600">
                          {approach.price_percentage}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">Safety</div>
                        <div className="text-2xl font-bold text-red-600">
                          {approach.safety_percentage}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">Technical</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {approach.technical_percentage}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-center text-sm text-gray-500">
                      Total: {approach.price_percentage + approach.safety_percentage + approach.technical_percentage}%
                    </div>
                    
                    {/* Technical Criteria */}
                    {approach.technical_criteria && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Technical Scoring Criteria:</div>
                        <div className="space-y-1">
                          {Object.entries(approach.technical_criteria).map(([points, description]) => (
                            <div key={points} className="flex items-start space-x-2 text-xs">
                              <span className="font-medium text-blue-600 min-w-0 flex-shrink-0">{points}:</span>
                              <span className="text-gray-600">{description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            disabled={!selectedApproach || !projectName.trim() || isCreating}
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
        </div>
      </div>
    </div>
  );
}
