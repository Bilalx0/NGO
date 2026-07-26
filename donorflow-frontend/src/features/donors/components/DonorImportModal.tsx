import { useState } from 'react';
import { FiUpload, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useQueryClient } from '@tanstack/react-query';

interface ImportResult {
  message: string;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; name: string; error: string }>;
}

export function DonorImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a valid CSV file');
        return;
      }
      setFile(selectedFile);
      setResult(null); // Reset previous results when new file is selected
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/donors/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setResult(response.data);
      queryClient.invalidateQueries({ queryKey: ['donors'] }); // Refresh the donor list
      
      if (response.data.errors.length === 0 && response.data.imported > 0) {
        toast.success(`Successfully imported ${response.data.imported} donors!`);
      } else {
        toast.warning(`Import completed with ${response.data.errors.length} errors.`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import donors');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Import Donors from CSV</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        {!result ? (
          // Upload State
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center hover:bg-muted/50 transition">
              <FiUpload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Select a CSV file with columns: <strong>name, email, phone, address</strong>
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" asChild className="cursor-pointer">
                  <span>Choose File</span>
                </Button>
              </label>
              {file && <p className="mt-3 text-sm font-medium text-primary">{file.name}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="bg-primary hover:bg-primary-hover"
              >
                {isUploading ? 'Uploading...' : 'Import Donors'}
              </Button>
            </div>
          </div>
        ) : (
          // Results State
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-3 text-foreground">Import Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <FiCheckCircle className="h-5 w-5" /> <span>{result.imported} Imported</span>
                </div>
                <div className="flex items-center gap-2 text-orange-600 font-medium">
                  <FiAlertCircle className="h-5 w-5" /> <span>{result.skipped} Skipped</span>
                </div>
                <div className="flex items-center gap-2 text-red-600 font-medium">
                  <FiAlertCircle className="h-5 w-5" /> <span>{result.errors.length} Errors</span>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Row</th>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.errors.map((err, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-muted-foreground">{err.row}</td>
                        <td className="px-4 py-2 font-medium text-foreground">{err.name}</td>
                        <td className="px-4 py-2 text-red-600">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleClose} className="bg-primary hover:bg-primary-hover">
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}