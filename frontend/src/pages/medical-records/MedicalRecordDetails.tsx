
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface MedicalRecord {
  id: number;
  patientName: string;
  patientId: string;
  type: string;
  date: string;
  provider: string;
  details: {
    summary: string;
    notes: string;
    attachments?: string[];
  };
  vitals?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    height: number;
    weight: number;
  };
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
  }[];
}

const MedicalRecordDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch data from API
    // For now, we'll use mock data
    const fetchRecord = () => {
      setLoading(true);
      setTimeout(() => {
        // Mock data based on ID
        setRecord({
          id: Number(id),
          patientName: "John Doe",
          patientId: "P12345",
          type: "Physical Exam",
          date: "2023-05-22",
          provider: "Dr. Williams",
          details: {
            summary: "Annual physical examination",
            notes: "Patient is in good health. No significant issues found. Recommended regular exercise and a balanced diet.",
            attachments: ["physical_exam_report.pdf", "lab_results.pdf"]
          },
          vitals: {
            bloodPressure: "120/80",
            heartRate: 72,
            temperature: 98.6,
            respiratoryRate: 16,
            height: 175,
            weight: 70
          },
          medications: [
            {
              name: "Vitamin D",
              dosage: "1000 IU",
              frequency: "Once daily",
              instructions: "Take with food"
            }
          ]
        });
        setLoading(false);
      }, 500);
    };

    fetchRecord();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  if (!record) {
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
          <Link to={`/patients/${record.patientId}`}>
            <Button variant="secondary">View Patient</Button>
          </Link>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Record Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p><strong>Patient:</strong> {record.patientName}</p>
              <p><strong>Patient ID:</strong> {record.patientId}</p>
              <p><strong>Record Type:</strong> {record.type}</p>
            </div>
            <div>
              <p><strong>Date:</strong> {format(new Date(record.date), 'MMMM dd, yyyy')}</p>
              <p><strong>Provider:</strong> {record.provider}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="details" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          {record.vitals && <TabsTrigger value="vitals">Vitals</TabsTrigger>}
          {record.medications && <TabsTrigger value="medications">Medications</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Record Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Summary</h3>
                  <p>{record.details.summary}</p>
                </div>
                <div>
                  <h3 className="font-medium">Notes</h3>
                  <p className="whitespace-pre-line">{record.details.notes}</p>
                </div>
                {record.details.attachments && record.details.attachments.length > 0 && (
                  <div>
                    <h3 className="font-medium">Attachments</h3>
                    <ul className="list-disc pl-5">
                      {record.details.attachments.map((attachment, index) => (
                        <li key={index}>
                          <a href="#" className="text-blue-500 hover:underline">
                            {attachment}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {record.vitals && (
          <TabsContent value="vitals">
            <Card>
              <CardHeader>
                <CardTitle>Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-medium">Blood Pressure</h3>
                    <p>{record.vitals.bloodPressure} mmHg</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Heart Rate</h3>
                    <p>{record.vitals.heartRate} bpm</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Temperature</h3>
                    <p>{record.vitals.temperature} °F</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Respiratory Rate</h3>
                    <p>{record.vitals.respiratoryRate} breaths/min</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Height</h3>
                    <p>{record.vitals.height} cm</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Weight</h3>
                    <p>{record.vitals.weight} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {record.medications && (
          <TabsContent value="medications">
            <Card>
              <CardHeader>
                <CardTitle>Medications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {record.medications.map((medication, index) => (
                    <div key={index} className="border p-4 rounded-md">
                      <h3 className="font-medium text-lg">{medication.name}</h3>
                      <p><strong>Dosage:</strong> {medication.dosage}</p>
                      <p><strong>Frequency:</strong> {medication.frequency}</p>
                      <p><strong>Instructions:</strong> {medication.instructions}</p>
                    </div>
                  ))}
                  {record.medications.length === 0 && (
                    <p>No medications prescribed.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      <CardFooter className="justify-end p-0">
        <Button variant="outline" onClick={() => window.print()} className="mr-2">
          Print Record
        </Button>
      </CardFooter>
    </div>
  );
};

export default MedicalRecordDetails;
