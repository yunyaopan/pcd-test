"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Check } from "lucide-react";
import * as XLSX from "xlsx";

interface TenderSubmission {
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

interface ExtractedData {
  documentNo: string;
  referenceNo: string;
  publicationDate: string;
  closingDate: string;
  description: string;
  suppliersCount: number;
  tenderSubmissions: TenderSubmission[];
}

interface ExcelUploadModalProps {
  onClose: () => void;
  onProjectCreated: () => void;
}

export function ExcelUploadModal({ onClose, onProjectCreated }: ExcelUploadModalProps) {
  const [step, setStep] = useState<'upload' | 'confirm'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }

  async function handleExtractData() {
    if (!file) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Extract data based on the Excel structure
      const extracted = extractProjectData(jsonData as unknown[][]);
      setExtractedData(extracted);
      setStep('confirm');
    } catch (error) {
      console.error('Error processing Excel file:', error);
      alert('Failed to process Excel file. Please ensure it\'s a valid Excel file.');
    } finally {
      setIsProcessing(false);
    }
  }

  function extractProjectData(data: unknown[][]): ExtractedData {
    // Look for the specific fields in the Excel data
    let documentNo = '';
    let referenceNo = '';
    let publicationDate = '';
    let closingDate = '';
    let description = '';
    let suppliersCount = 0;
    let tenderSubmissions: TenderSubmission[] = [];

    // Search through the data to find the fields
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '');
          
          // Updated logic for all fields - look for exact match and get value from next row
          if (cell.includes('Document No. :')) {
            // Check if there's a next row and get the value from the same column
            if (i + 1 < data.length && data[i + 1] && data[i + 1][j] !== undefined) {
              documentNo = String(data[i + 1][j] || '');
            }
          } else if (cell.includes('Reference No. :')) {
            if (i + 1 < data.length && data[i + 1] && data[i + 1][j] !== undefined) {
              referenceNo = String(data[i + 1][j] || '');
            }
          } else if (cell.includes('Publication Date :')) {
            if (i + 1 < data.length && data[i + 1] && data[i + 1][j] !== undefined) {
              publicationDate = String(data[i + 1][j] || '');
            }
          } else if (cell.includes('Closing Date :')) {
            if (i + 1 < data.length && data[i + 1] && data[i + 1][j] !== undefined) {
              closingDate = String(data[i + 1][j] || '');
            }
          } else if (cell.includes('Description :')) {
            if (i + 1 < data.length && data[i + 1] && data[i + 1][j] !== undefined) {
              description = String(data[i + 1][j] || '');
            }
          } else if (cell.includes('No. of Suppliers Participated in this notice :')) {
            if (i + 1 < data.length && data[i + 1] && data[i + 1][j] !== undefined) {
              suppliersCount = parseInt(String(data[i + 1][j] || '0')) || 0;
            }
          } else if (cell.includes('Schedule Of Rates No.')) {
            // Found the tender submissions table header
            tenderSubmissions = extractTenderSubmissions(data, i);
          }
        }
      }
    }

    return {
      documentNo,
      referenceNo,
      publicationDate,
      closingDate,
      description,
      suppliersCount,
      tenderSubmissions
    };
  }

  function extractTenderSubmissions(data: unknown[][], headerRowIndex: number): TenderSubmission[] {
    const submissions: TenderSubmission[] = [];
    
    // Start from the row after the header
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      
      // Check if row is empty (end of data)
      if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
        break;
      }
      
      // Extract data from the row
      const submission: TenderSubmission = {
        scheduleOfRatesNo: String(row[0] || ''),
        tradingPartnerReferenceNo: String(row[1] || ''),
        supplierName: String(row[2] || ''),
        responseNo: String(row[3] || ''),
        scheduleOfRatesDescription: String(row[4] || ''),
        percentageAdjustment: parseFloat(String(row[5] || '0')) || 0,
        percentageSign: String(row[6] || ''),
        entryDate: String(row[7] || ''),
        supplierRemarks: String(row[8] || '')
      };
      
      // Only add if it has at least some data
      if (submission.scheduleOfRatesNo || submission.supplierName) {
        submissions.push(submission);
      }
    }
    
    return submissions;
  }

  async function handleConfirmAndSave() {
    if (!extractedData) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: extractedData.documentNo || 'Untitled Project',
          document_no: extractedData.documentNo,
          reference_no: extractedData.referenceNo,
          publication_date: extractedData.publicationDate,
          closing_date: extractedData.closingDate,
          description: extractedData.description,
          suppliers_count: extractedData.suppliersCount,
          tender_submissions: extractedData.tenderSubmissions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      onProjectCreated();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {step === 'upload' ? 'Upload Excel File' : 'Confirm Project Data'}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Excel File
                </label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="mb-4"
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    {file.name} selected
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium mb-2">Expected Excel Format:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Document No.</li>
                  <li>• Reference No.</li>
                  <li>• Publication Date</li>
                  <li>• Closing Date</li>
                  <li>• Description</li>
                  <li>• No. of Suppliers Participated</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleExtractData} 
                  disabled={!file || isProcessing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Extract Data'}
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && extractedData && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-medium text-green-800 mb-2">Extracted Data:</h4>
                <div className="grid gap-2 text-sm mb-4">
                  <div><strong>Document No.:</strong> {extractedData.documentNo || 'Not found'}</div>
                  <div><strong>Reference No.:</strong> {extractedData.referenceNo || 'Not found'}</div>
                  <div><strong>Publication Date:</strong> {extractedData.publicationDate || 'Not found'}</div>
                  <div><strong>Closing Date:</strong> {extractedData.closingDate || 'Not found'}</div>
                  <div><strong>Description:</strong> {extractedData.description || 'Not found'}</div>
                  <div><strong>Suppliers Count:</strong> {extractedData.suppliersCount || 'Not found'}</div>
                </div>
                
                {extractedData.tenderSubmissions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-800 mb-2">Tender Submissions ({extractedData.tenderSubmissions.length}):</h5>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-xs border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-1">Schedule No.</th>
                            <th className="border border-gray-300 p-1">Supplier</th>
                            <th className="border border-gray-300 p-1">Response No.</th>
                            <th className="border border-gray-300 p-1">Adjustment</th>
                            <th className="border border-gray-300 p-1">Sign</th>
                          </tr>
                        </thead>
                        <tbody>
                          {extractedData.tenderSubmissions.map((submission, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 p-1">{submission.scheduleOfRatesNo}</td>
                              <td className="border border-gray-300 p-1">{submission.supplierName}</td>
                              <td className="border border-gray-300 p-1">{submission.responseNo}</td>
                              <td className="border border-gray-300 p-1">{submission.percentageAdjustment}</td>
                              <td className="border border-gray-300 p-1">{submission.percentageSign}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back to Upload
                </Button>
                <Button 
                  onClick={handleConfirmAndSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Create Project'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
