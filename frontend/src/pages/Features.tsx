
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Pill, Stethoscope, Boxes, TrendingUp, ShieldCheck, Users } from "lucide-react";

const FeatureCard = ({ icon, title, description, features }) => (
  <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
    <CardHeader className="flex flex-row items-center gap-4">
      {icon}
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="mb-4 text-muted-foreground">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle className="mr-2 mt-1 h-4 w-4 text-green-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const FeaturesPage = () => {
  const features = [
    {
      icon: <Stethoscope className="h-8 w-8 text-blue-500" />,
      title: "Clinical EMR",
      description: "A comprehensive and intuitive Electronic Medical Records system.",
      features: [
        "Customizable patient charting and templates",
        "Real-time clinical decision support",
        "Integrated e-prescribing and medication management",
        "Seamless lab and imaging integration",
        "Secure patient portal for engagement",
      ],
    },
    {
      icon: <Pill className="h-8 w-8 text-green-500" />,
      title: "Pharmacy Management",
      description: "Streamline your entire pharmacy workflow from prescription to dispensing.",
      features: [
        "Automated inventory tracking and reordering",
        "Dispensing and barcode verification",
        "Controlled substance management and reporting",
        "Patient medication adherence monitoring",
        "Integration with wholesaler purchasing",
      ],
    },
    {
      icon: <Boxes className="h-8 w-8 text-purple-500" />,
      title: "Warehouse & Inventory Logistics",
      description: "Manage medical supplies and equipment across your entire organization.",
      features: [
        "Multi-location stock management",
        "Purchase order and vendor management",
        "Automated stock level alerts",
        "Batch and expiry date tracking",
        "Detailed inventory audit trails",
      ],
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-orange-500" />,
      title: "Analytics & Business Intelligence",
      description: "Unlock actionable insights with powerful, real-time data visualization.",
      features: [
        "Customizable dashboards for clinical and financial KPIs",
        "Population health trend analysis",
        "Operational efficiency reporting",
        "Automated report generation and distribution",
        "Predictive analytics for resource planning",
      ],
    },
    {
        icon: <ShieldCheck className="h-8 w-8 text-red-500" />,
        title: "Security & Compliance",
        description: "Protect patient data and ensure regulatory compliance with enterprise-grade security.",
        features: [
            "HIPAA, GDPR, and SOC 2 compliant infrastructure",
            "Role-based access control (RBAC)",
            "End-to-end data encryption",
            "Comprehensive audit logs and activity tracking",
            "Regular security audits and penetration testing"
        ]
    },
    {
        icon: <Users className="h-8 w-8 text-yellow-500" />,
        title: "User & Practice Management",
        description: "Administer users, roles, and practice settings from a centralized command center.",
        features: [
            "Multi-provider and multi-clinic support",
            "Customizable user roles and permissions",
            "Automated billing and insurance claim processing",
            "Appointment scheduling and resource management",
            "Secure internal messaging and collaboration tools"
        ]
    }
  ];

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            An Unparalleled Feature Set
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground">
            OmniCare is engineered to provide a seamless, integrated experience across every department of your healthcare organization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
