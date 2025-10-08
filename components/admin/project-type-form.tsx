"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ProjectType {
  id: string;
  name: string;
  price_percentage: number;
  quality_percentage: number;
}

interface ProjectTypeFormProps {
  projectType?: ProjectType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectTypeForm({ projectType, onClose, onSuccess }: ProjectTypeFormProps) {
  const [name, setName] = useState("");
  const [pricePercentage, setPricePercentage] = useState(70);
  const [qualityPercentage, setQualityPercentage] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectType) {
      setName(projectType.name);
      setPricePercentage(projectType.price_percentage);
      setQualityPercentage(projectType.quality_percentage);
    }
  }, [projectType]);

  function handlePriceChange(value: number) {
    setPricePercentage(value);
    setQualityPercentage(100 - value);
  }

  function handleQualityChange(value: number) {
    setQualityPercentage(value);
    setPricePercentage(100 - value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      alert("Project type name is required");
      return;
    }

    if (pricePercentage + qualityPercentage !== 100) {
      alert("Price and quality percentages must sum to 100");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = projectType 
        ? `/api/admin/project-types/${projectType.id}`
        : '/api/admin/project-types';
      
      const method = projectType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          price_percentage: pricePercentage,
          quality_percentage: qualityPercentage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project type');
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save project type:', error);
      alert(`Failed to save project type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {projectType ? 'Edit Project Type' : 'Add Project Type'}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Type Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Type Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Construction, IT Services"
              required
            />
          </div>

          {/* Price-Quality Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Price-Quality Ratio *
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Price</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={pricePercentage}
                    onChange={(e) => handlePriceChange(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Quality</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={qualityPercentage}
                    onChange={(e) => handleQualityChange(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-center text-sm text-gray-500">
              Total: {pricePercentage + qualityPercentage}%
            </div>
            
            {pricePercentage + qualityPercentage !== 100 && (
              <div className="mt-2 text-sm text-red-600">
                ⚠️ Price and quality percentages must sum to 100%
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || pricePercentage + qualityPercentage !== 100}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {projectType ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                projectType ? 'Update Project Type' : 'Create Project Type'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
