
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getFHIRPatient, searchFHIRPatient, getFHIREncounter } from '@/lib/fhir-service';
import type { FHIRPatient, FHIREncounter, FHIRBundle } from '@/lib/fhir-service';

const FHIRViewer = () => {
  const { toast } = useToast();
  const [patientId, setPatientId] = useState('');
  const [mrn, setMrn] = useState('');
  const [visitId, setVisitId] = useState('');
  const [activeTab, setActiveTab] = useState('patient-by-id');

  // Fetch FHIR Patient by ID
  const { data: fhirPatientById, isLoading: loadingPatientById } = useQuery<FHIRPatient>({
    queryKey: ['fhir-patient', patientId],
    queryFn: async () => {
      if (!patientId) throw new Error('Patient ID is required');
      return getFHIRPatient(parseInt(patientId, 10));
    },
    enabled: activeTab === 'patient-by-id' && !!patientId,
  });

  // Search FHIR Patient by MRN
  const { data: fhirPatientSearch, isLoading: loadingPatientSearch } = useQuery<FHIRBundle>({
    queryKey: ['fhir-patient-search', mrn],
    queryFn: async () => {
      if (!mrn) throw new Error('MRN is required');
      return searchFHIRPatient(mrn);
    },
    enabled: activeTab === 'patient-by-mrn' && !!mrn,
  });

  // Fetch FHIR Encounter
  const { data: fhirEncounter, isLoading: loadingEncounter } = useQuery<FHIREncounter>({
    queryKey: ['fhir-encounter', visitId],
    queryFn: async () => {
      if (!visitId) throw new Error('Visit ID is required');
      return getFHIREncounter(parseInt(visitId, 10));
    },
    enabled: activeTab === 'encounter' && !!visitId,
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">FHIR Resource Viewer</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="patient-by-id">Patient by ID</TabsTrigger>
          <TabsTrigger value="patient-by-mrn">Patient by MRN</TabsTrigger>
          <TabsTrigger value="encounter">Encounter</TabsTrigger>
        </TabsList>

        <TabsContent value="patient-by-id">
          <Card>
            <CardHeader>
              <CardTitle>Get FHIR Patient by Person ID</CardTitle>
              <CardDescription>Retrieve a FHIR Patient resource using the person ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patient-id">Person ID</Label>
                <Input
                  id="patient-id"
                  type="number"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="Enter person ID"
                />
              </div>
              {loadingPatientById ? (
                <Skeleton className="h-64 w-full" />
              ) : fhirPatientById ? (
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(fhirPatientById, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">Enter a person ID to view FHIR Patient resource</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patient-by-mrn">
          <Card>
            <CardHeader>
              <CardTitle>Search FHIR Patient by MRN</CardTitle>
              <CardDescription>Search for a FHIR Patient resource using Medical Record Number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mrn">MRN</Label>
                <Input
                  id="mrn"
                  value={mrn}
                  onChange={(e) => setMrn(e.target.value)}
                  placeholder="Enter MRN (e.g., MRN-2024-000123)"
                />
              </div>
              {loadingPatientSearch ? (
                <Skeleton className="h-64 w-full" />
              ) : fhirPatientSearch ? (
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(fhirPatientSearch, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">Enter an MRN to search for FHIR Patient resource</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encounter">
          <Card>
            <CardHeader>
              <CardTitle>Get FHIR Encounter by Visit ID</CardTitle>
              <CardDescription>Retrieve a FHIR Encounter resource using the visit ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="visit-id">Visit ID</Label>
                <Input
                  id="visit-id"
                  type="number"
                  value={visitId}
                  onChange={(e) => setVisitId(e.target.value)}
                  placeholder="Enter visit ID"
                />
              </div>
              {loadingEncounter ? (
                <Skeleton className="h-64 w-full" />
              ) : fhirEncounter ? (
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(fhirEncounter, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">Enter a visit ID to view FHIR Encounter resource</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FHIRViewer;

