
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const AppointmentsList = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([
    { id: 1, patientName: "John Doe", date: "2023-06-10", time: "09:00 AM", status: "Scheduled" },
    { id: 2, patientName: "Jane Smith", date: "2023-06-12", time: "11:30 AM", status: "Completed" },
    { id: 3, patientName: "Robert Johnson", date: "2023-06-15", time: "02:00 PM", status: "Cancelled" },
  ]);

  const handleCancelAppointment = (id: number) => {
    setAppointments(appointments.map(app => 
      app.id === id ? { ...app, status: "Cancelled" } : app
    ));
    
    toast({
      title: "Appointment Cancelled",
      description: "The appointment has been cancelled successfully.",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Link to="/appointments/new">
          <Button>New Appointment</Button>
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="overflow-hidden">
            <CardHeader className={`
              ${appointment.status === 'Scheduled' ? 'bg-blue-50' : 
                appointment.status === 'Completed' ? 'bg-green-50' : 'bg-red-50'}
            `}>
              <CardTitle className="flex justify-between">
                <span>{appointment.patientName}</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 
                  appointment.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {appointment.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p><strong>Date:</strong> {appointment.date}</p>
                <p><strong>Time:</strong> {appointment.time}</p>
                <div className="flex space-x-2 mt-4">
                  <Link to={`/appointments/${appointment.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">View/Edit</Button>
                  </Link>
                  {appointment.status === 'Scheduled' && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsList;
