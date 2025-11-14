
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as z from 'zod';

// Form validation schema matching backend DTO
const formSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required.' }).max(100),
  last_name: z.string().min(1, { message: 'Last name is required.' }).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format.' }),
  gender_concept_id: z.number().min(1),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Please enter a valid email address.' }).optional().or(z.literal('')),
  race_concept_id: z.number().optional(),
  ethnicity_concept_id: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Gender options (OMOP concept IDs)
const GENDER_OPTIONS = [
  { value: 8507, label: 'Male' },
  { value: 8532, label: 'Female' },
];

const PatientForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      dob: '',
      gender_concept_id: 8507,
      phone: '',
      email: '',
      race_concept_id: undefined,
      ethnicity_concept_id: undefined,
    },
  });

  interface PatientData {
    first_name?: string;
    last_name?: string;
    year_of_birth?: number;
    month_of_birth?: number;
    day_of_birth?: number;
    gender_concept_id?: number;
    race_concept_id?: number;
    ethnicity_concept_id?: number;
    contact?: {
      phone?: string;
      email?: string;
    };
  }

  // Fetch patient data if editing
  const { data: patientData, isLoading } = useQuery<PatientData | null>({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (!id) return null;
      return apiClient.get<PatientData>(`/patients/${id}`);
    },
    enabled: isEditMode && !!id,
  });

  // Populate form when patient data is loaded
  useEffect(() => {
    if (patientData && isEditMode) {
      const dob = patientData.year_of_birth && patientData.month_of_birth && patientData.day_of_birth
        ? `${patientData.year_of_birth}-${String(patientData.month_of_birth).padStart(2, '0')}-${String(patientData.day_of_birth).padStart(2, '0')}`
        : '';

      form.reset({
        first_name: patientData.first_name || '',
        last_name: patientData.last_name || '',
        dob,
        gender_concept_id: patientData.gender_concept_id || 8507,
        phone: patientData.contact?.phone || '',
        email: patientData.contact?.email || '',
        race_concept_id: patientData.race_concept_id,
        ethnicity_concept_id: patientData.ethnicity_concept_id,
      });
    }
  }, [patientData, isEditMode, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Prepare request body matching backend DTO
      const requestBody: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        dob: data.dob,
        gender_concept_id: data.gender_concept_id,
      };

      // Add contact info if provided
      if (data.phone || data.email) {
        requestBody.contact = {};
        if (data.phone) requestBody.contact.phone = data.phone;
        if (data.email) requestBody.contact.email = data.email;
      }

      // Add optional fields
      if (data.race_concept_id) requestBody.race_concept_id = data.race_concept_id;
      if (data.ethnicity_concept_id) requestBody.ethnicity_concept_id = data.ethnicity_concept_id;

      if (isEditMode && id) {
        // Update existing patient
        await apiClient.patch(`/patients/${id}`, requestBody);
        toast({
          title: 'Patient updated',
          description: `${data.first_name} ${data.last_name}'s information has been updated.`
        });
      } else {
        // Create new patient
        await apiClient.post('/patients', requestBody);
        toast({
          title: 'Patient created',
          description: `${data.first_name} ${data.last_name} has been added to the system.`
        });
      }

      navigate('/patients');
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'There was a problem saving the patient information.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/patients')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="page-title m-0">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="page-title m-0">
          {isEditMode ? 'Edit Patient' : 'Add New Patient'}
        </h1>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Patient Information' : 'Patient Information'}</CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Update the patient\'s information below.'
              : 'Enter the new patient\'s information below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender_concept_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENDER_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/patients')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      {isEditMode ? 'Update Patient' : 'Save Patient'}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientForm;
