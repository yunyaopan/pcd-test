"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string | null;
  detailed_scoring_methodology: string | null;
}

interface EvaluationCriteriaFormProps {
  criteria?: EvaluationCriteria | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EvaluationCriteriaForm({ criteria, onClose, onSuccess }: EvaluationCriteriaFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [detailedScoringMethodology, setDetailedScoringMethodology] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (criteria) {
      setName(criteria.name);
      setDescription(criteria.description || "");
      setDetailedScoringMethodology(criteria.detailed_scoring_methodology || "");
    }
  }, [criteria]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      alert("Evaluation criteria name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = criteria 
        ? `/api/admin/evaluation-criteria/${criteria.id}`
        : '/api/admin/evaluation-criteria';
      
      const method = criteria ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          detailed_scoring_methodology: detailedScoringMethodology.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save evaluation criteria');
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save evaluation criteria:', error);
      alert(`Failed to save evaluation criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {criteria ? 'Edit Evaluation Criteria' : 'Add Evaluation Criteria'}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Criteria Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criteria Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Technical Capability, Safety Record"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what this criteria evaluates..."
              rows={3}
            />
          </div>

          {/* Detailed Scoring Methodology */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Scoring Methodology *
            </label>
            <textarea
              value={detailedScoringMethodology}
              onChange={(e) => setDetailedScoringMethodology(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the detailed scoring methodology, conditions, and point system..."
              rows={5}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {criteria ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                criteria ? 'Update Criteria' : 'Create Criteria'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
