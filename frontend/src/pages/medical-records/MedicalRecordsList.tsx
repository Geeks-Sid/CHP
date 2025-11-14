
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { format } from "date-fns";
import { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";

interface Document {
  document_id: string;
  patient_person_id: number;
  file_name?: string;
  document_type?: string;
  description?: string;
  uploaded_at: string;
  download_url?: string;
}

interface DocumentListResponse {
  items: Document[];
  nextCursor?: string;
}

const MedicalRecordsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch documents with React Query
  const { data, isLoading, error } = useQuery<DocumentListResponse>({
    queryKey: ['documents', filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== "all") {
        params.append('document_type', filterType);
      }
      params.append('limit', '50');

      const queryString = params.toString();
      return apiClient.get<DocumentListResponse>(`/documents${queryString ? `?${queryString}` : ''}`);
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching medical records',
        description: error instanceof ApiClientError ? error.message : 'There was a problem loading medical records.',
      });
    }
  }, [error, toast]);

  const records = data?.items || [];

  const filteredRecords = records.filter(record => {
    const matchesSearch =
      (record.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (record.document_type?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesType = filterType === "all" || record.document_type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Medical Records</h1>
        <Button onClick={() => navigate('/medical-records/upload')}>
          Upload Document
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by patient name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="filter">Filter by Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Lab Result">Lab Result</SelectItem>
              <SelectItem value="Prescription">Prescription</SelectItem>
              <SelectItem value="Physical Exam">Physical Exam</SelectItem>
              <SelectItem value="Vaccination">Vaccination</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((record) => (
              <Link to={`/medical-records/${record.document_id}`} key={record.document_id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{record.document_type || 'Medical Record'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{record.file_name || 'Untitled Document'}</span>
                        <span className="text-sm text-gray-500">Patient ID: {record.patient_person_id}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Date: {format(new Date(record.uploaded_at), 'MMM dd, yyyy')}</p>
                        {record.description && <p>{record.description}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No medical records found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MedicalRecordsList;
