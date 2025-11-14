
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Patient {
  person_id: number;
  first_name?: string;
  last_name?: string;
  mrn: string;
}

const DocumentUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    patient_person_id: '',
    document_type: '',
    description: '',
  });

  // Fetch patients for dropdown
  const { data: patientsData } = useQuery<{ items: Patient[] }>({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      return apiClient.get<{ items: Patient[] }>('/patients?limit=100');
    },
  });

  // Step 1: Get presigned URL
  const presignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !formData.patient_person_id) {
        throw new Error('Please select a file and patient');
      }
      return apiClient.post<{
        upload_id: string;
        url: string;
        expires_at: string;
      }>('/documents/presign', {
        file_name: selectedFile.name,
        content_type: selectedFile.type,
        size_bytes: selectedFile.size,
        patient_person_id: parseInt(formData.patient_person_id, 10),
      });
    },
  });

  // Step 2: Upload file to presigned URL
  const uploadFile = async (presignedUrl: string, file: File): Promise<void> => {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }
  };

  // Step 3: Confirm upload
  const confirmMutation = useMutation({
    mutationFn: async (data: { uploadId: string; filePath: string }) => {
      return apiClient.post('/documents/confirm', {
        upload_id: data.uploadId,
        file_path: data.filePath,
        patient_person_id: parseInt(formData.patient_person_id, 10),
        document_type: formData.document_type,
        description: formData.description || undefined,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !formData.patient_person_id || !formData.document_type) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields and select a file',
      });
      return;
    }

    try {
      // Step 1: Get presigned URL
      const presignResult = await presignMutation.mutateAsync();

      // Step 2: Upload file
      await uploadFile(presignResult.url, selectedFile);

      // Extract file path from presigned URL or construct it
      // The backend generates the S3 key, so we need to construct it the same way
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `documents/${year}/${month}/${presignResult.upload_id}/${sanitizedFileName}`;

      // Step 3: Confirm upload
      await confirmMutation.mutateAsync({ uploadId: presignResult.upload_id, filePath });

      toast({
        title: 'Document uploaded',
        description: 'The document has been successfully uploaded.',
      });

      navigate('/medical-records');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof ApiClientError ? error.message : 'There was a problem uploading the document.',
      });
    }
  };

  const patients = patientsData?.items || [];
  const isUploading = presignMutation.isPending || confirmMutation.isPending;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/medical-records')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Medical Records
        </Button>
        <h1 className="text-2xl font-bold">Upload Document</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
          <CardDescription>
            Upload a medical document for a patient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="patient_person_id">Patient *</Label>
              <select
                id="patient_person_id"
                value={formData.patient_person_id}
                onChange={(e) => setFormData({ ...formData, patient_person_id: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient.person_id} value={patient.person_id}>
                    {patient.first_name} {patient.last_name} (MRN: {patient.mrn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="document_type">Document Type *</Label>
              <Input
                id="document_type"
                value={formData.document_type}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                placeholder="e.g., medical_report, lab_result, prescription"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div>
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/medical-records')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;

