
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { format } from "date-fns";
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

interface Document {
  document_id: string;
  patient_person_id: number;
  file_name?: string;
  document_type?: string;
  description?: string;
  uploaded_at: string;
  download_url?: string;
}

const MedicalRecordDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: document, isLoading, error } = useQuery<Document>({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id) throw new Error('Document ID is required');
      return apiClient.get<Document>(`/documents/${id}`);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading document',
        description: error instanceof ApiClientError ? error.message : 'There was a problem loading the document.',
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Medical Record Not Found</h1>
        <p>The requested medical record could not be found.</p>
        <Button onClick={() => navigate('/medical-records')} className="mt-4">
          Back to Medical Records
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Medical Record Details</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate('/medical-records')}>
            Back to List
          </Button>
          <Link to={`/patients/${document.patient_person_id}`}>
            <Button variant="secondary">View Patient</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p><strong>Filename:</strong> {document.file_name || 'Untitled Document'}</p>
              <p><strong>Patient ID:</strong> {document.patient_person_id}</p>
              <p><strong>Document Type:</strong> {document.document_type || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Date:</strong> {format(new Date(document.uploaded_at), 'MMMM dd, yyyy')}</p>
              {document.description && (
                <p><strong>Description:</strong> {document.description}</p>
              )}
            </div>
          </div>
          {document.download_url && (
            <div className="mt-4">
              <Button asChild>
                <a href={document.download_url} target="_blank" rel="noopener noreferrer">
                  Download Document
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Link to={`/patients/${document.patient_person_id}`}>
        <Button variant="secondary" className="mb-4">
          View Patient
        </Button>
      </Link>

      <CardFooter className="justify-end p-0">
        <Button variant="outline" onClick={() => window.print()} className="mr-2">
          Print Record
        </Button>
      </CardFooter>
    </div>
  );
};

export default MedicalRecordDetails;

