
import { useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const MedicalRecordsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const records = [
    { id: 1, patientName: "John Doe", patientId: "P12345", type: "Lab Result", date: "2023-05-15", provider: "Dr. Smith" },
    { id: 2, patientName: "Jane Smith", patientId: "P12346", type: "Prescription", date: "2023-05-20", provider: "Dr. Johnson" },
    { id: 3, patientName: "Robert Johnson", patientId: "P12347", type: "Physical Exam", date: "2023-05-22", provider: "Dr. Williams" },
    { id: 4, patientName: "John Doe", patientId: "P12345", type: "Vaccination", date: "2023-05-25", provider: "Dr. Brown" },
  ];

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || record.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Medical Records</h1>
      
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
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecords.map((record) => (
          <Link to={`/medical-records/${record.id}`} key={record.id}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">{record.type}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{record.patientName}</span>
                    <span className="text-sm text-gray-500">{record.patientId}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Date: {format(new Date(record.date), 'MMM dd, yyyy')}</p>
                    <p>Provider: {record.provider}</p>
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
    </div>
  );
};

export default MedicalRecordsList;
