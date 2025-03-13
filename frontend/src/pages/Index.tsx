
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LockIcon, UserIcon, CalendarIcon } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="relative">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-96">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <div className="pill bg-white/20 text-white mb-6">Modern Healthcare Platform</div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
                Streamlined Medical Practice Management
              </h1>
              <p className="text-lg mb-8">
                A comprehensive solution for patients, receptionists, and clinicians to manage healthcare efficiently.
              </p>
              <div className="flex space-x-4">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-white/90">
                  <Link to="/login">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 transform translate-y-1/2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: UserIcon,
                  title: 'For Patients',
                  description: 'Access your medical records, appointments, and reports anytime.'
                },
                {
                  icon: CalendarIcon,
                  title: 'For Receptionists',
                  description: 'Manage patient information and appointments efficiently.'
                },
                {
                  icon: LockIcon,
                  title: 'For Clinicians',
                  description: 'Access patient histories and update medical records instantly.'
                },
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-lg glass-panel">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-full inline-flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content Sections */}
      <main className="pt-48 pb-16 bg-gray-50">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
              Designed for Every Healthcare Role
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-500">
              Our platform provides tailored experiences for each role in the healthcare ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Patient Portal',
                description: 'View your appointments, medical history, and test results in one place.',
                features: [
                  'Appointment scheduling',
                  'Medical history access',
                  'Test result viewing',
                  'Secure messaging with providers'
                ]
              },
              {
                title: 'Receptionist Dashboard',
                description: 'Efficiently manage patient information and appointment scheduling.',
                features: [
                  'Patient registration',
                  'Appointment management',
                  'Visit check-in/check-out',
                  'Insurance verification'
                ]
              },
              {
                title: 'Clinician Workspace',
                description: 'Access comprehensive patient information and update medical records.',
                features: [
                  'Patient medical records',
                  'Treatment planning',
                  'Prescription management',
                  'Lab result review'
                ]
              }
            ].map((card, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden glass-panel">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                  <p className="text-gray-600 mb-4">{card.description}</p>
                  <ul className="space-y-2">
                    {card.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
                Ready to Streamline Your Healthcare Experience?
              </h2>
              <p className="max-w-2xl mx-auto text-xl text-gray-500">
                Join our platform today and experience the future of healthcare management.
              </p>
            </div>
            <div className="text-center">
              <Button asChild size="lg">
                <Link to="/login">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">© 2023 MedicalApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
