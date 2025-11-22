
import { Button } from '@/components/ui/button';
import { ArrowRight, Boxes, Pill, Stethoscope, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span className="font-bold text-lg">OmniCare</span>
          </Link>
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
            <Link
              to="/features"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Features
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="animate-glow">
              <Link to="/login">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex items-center justify-center h-[85vh] overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]"></div>
          </div>
          <div className="container text-center animate-fade-in" style={{ animationDuration: '1.5s' }}>
            <div className="bg-primary/10 text-primary mb-4 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium">
              The All-in-One Healthcare Operating System
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
              Orchestrate Your Entire Practice
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              From patient records and clinical workflows to pharmacy inventory and warehouse logistics, OmniCare brings everything into a single, intelligent platform.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/login">Request a Demo <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/features">Explore Features</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="py-24 bg-secondary/50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">One Platform, Limitless Possibilities</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                We've built a comprehensive suite of tools to manage every facet of your healthcare organization.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-xl bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <Stethoscope className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2">Clinical EMR, Reimagined</h3>
                <p className="text-muted-foreground mb-6">
                  An intuitive, fast, and powerful Electronic Medical Records system designed for modern clinicians. Focus on patients, not paperwork.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center"><ArrowRight className="h-4 w-4 text-primary/70 mr-2" /> Customizable patient dashboards and charting.</li>
                  <li className="flex items-center"><ArrowRight className="h-4 w-4 text-primary/70 mr-2" /> AI-powered coding suggestions and documentation.</li>
                  <li className="flex items-center"><ArrowRight className="h-4 w-4 text-primary/70 mr-2" /> Seamless integration with labs and imaging.</li>
                </ul>
              </div>
              <div className="rounded-xl bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <Pill className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2">Pharmacy Management</h3>
                <p className="text-muted-foreground">
                  Integrated e-prescribing, inventory control, and dispensing workflows to enhance safety and efficiency.
                </p>
              </div>
              <div className="rounded-xl bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <Boxes className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2">Warehouse Logistics</h3>
                <p className="text-muted-foreground">
                  Manage medical supplies, stock levels, and distribution across multiple locations with ease.
                </p>
              </div>
              <div className="lg:col-span-2 rounded-xl bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2">Analytics & Reporting</h3>
                <p className="text-muted-foreground">
                  Gain actionable insights with real-time dashboards on clinical outcomes, financial performance, and operational efficiency.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container text-center">
            <h2 className="text-4xl font-bold tracking-tight">Ready to Transform Your Practice?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Join the growing number of practices choosing OmniCare to improve patient outcomes and streamline operations.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild className="animate-pulse">
                <Link to="/login">Get Started in Minutes</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-secondary/50">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center space-x-2">
                 <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                <span className="font-bold">OmniCare</span>
              </Link>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/features" className="hover:text-primary">Features</Link></li>
                <li><Link to="#" className="hover:text-primary">Integrations</Link></li>
                <li><Link to="#" className="hover:text-primary">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary">About Us</Link></li>
                <li><Link to="#" className="hover:text-primary">Careers</Link></li>
                <li><Link to="#" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary">Blog</Link></li>
                <li><Link to="#" className="hover:text-primary">Support</Link></li>
                <li><Link to="#" className="hover:text-primary">API Docs</Link></li>
              </ul>
            </div>
             <div>
              <h4 className="font-semibold mb-2">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary">Privacy</Link></li>
                <li><Link to="#" className="hover:text-primary">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} OmniCare. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
