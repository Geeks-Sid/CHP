import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Treemap } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

// --- Existing Data (Keep as is) ---
const diseaseData = [
  // ... (same as before)
  { name: 'Hypertension', count: 1253, change: '+12%', department: 'Cardiology' },
  { name: 'Diabetes', count: 985, change: '+8%', department: 'Endocrinology' },
  { name: 'Respiratory Infections', count: 782, change: '-3%', department: 'Pulmonology' },
  { name: 'Anxiety Disorders', count: 654, change: '+15%', department: 'Psychiatry' },
  { name: 'Arthritis', count: 521, change: '+5%', department: 'Rheumatology' },
  { name: 'Asthma', count: 423, change: '+2%', department: 'Pulmonology' }
];
const monthlyRevenue = [
  // ... (same as before)
  { month: 'Jan', revenue: 320000, patients: 1200 },
  { month: 'Feb', revenue: 305000, patients: 1150 },
  { month: 'Mar', revenue: 340000, patients: 1300 },
  { month: 'Apr', revenue: 360000, patients: 1400 },
  { month: 'May', revenue: 375000, patients: 1450 },
  { month: 'Jun', revenue: 390000, patients: 1500 },
  { month: 'Jul', revenue: 400000, patients: 1550 },
  { month: 'Aug', revenue: 395000, patients: 1530 },
  { month: 'Sep', revenue: 380000, patients: 1480 },
  { month: 'Oct', revenue: 410000, patients: 1600 },
  { month: 'Nov', revenue: 420000, patients: 1650 },
  { month: 'Dec', revenue: 450000, patients: 1800 }
];
const patientDemographics = [
  // ... (same as before)
  { name: '0-17', value: 15 },
  { name: '18-34', value: 25 },
  { name: '35-50', value: 30 },
  { name: '51-65', value: 20 },
  { name: '66+', value: 10 }
];
// --- NEW SDOH Data ---

// Place of Birth/Growth/Living (Urban/Suburban/Rural)
const birthLocationData = [
  { name: 'Urban', value: 40 },
  { name: 'Suburban', value: 35 },
  { name: 'Rural', value: 25 },
];

const growthLocationData = [
  { name: 'Urban', value: 48 },
  { name: 'Suburban', value: 42 },
  { name: 'Rural', value: 10 },
];

const currentLivingData = [
  { name: 'Urban', value: 55 },
  { name: 'Suburban', value: 38 },
  { name: 'Rural', value: 7 },
];

// Age - Keep the existing patientDemographics
const ageDemographics = [ // Renamed for clarity
  { name: '0-17', value: 15 },
  { name: '18-34', value: 25 },
  { name: '35-50', value: 30 },
  { name: '51-65', value: 20 },
  { name: '66+', value: 10 }
];

// Education Level
const educationLevelData = [
  { name: 'Less than High School', value: 8 },
  { name: 'High School Grad / GED', value: 28 },
  { name: 'Some College / Assoc.', value: 25 },
  { name: 'Bachelor\'s Degree', value: 29 },
  { name: 'Graduate Degree +', value: 10 },
];

// Occupation (Broad Categories)
const occupationData = [
  { name: 'Healthcare', value: 12 },
  { name: 'Technology', value: 15 },
  { name: 'Education', value: 10 },
  { name: 'Service Industry', value: 20 },
  { name: 'Manufacturing/Labor', value: 13 },
  { name: 'Office/Admin', value: 15 },
  { name: 'Unemployed/Retired', value: 10 },
  { name: 'Other', value: 5 },
];

// Working Conditions (Example Categories)
const workingConditionsData = [
  { name: 'Mostly Sedentary', value: 45 },
  { name: 'Moderate Physical Activity', value: 35 },
  { name: 'Physically Demanding', value: 15 },
  { name: 'High Stress Environment', value: 5 }, // Can overlap, simplified here
];

// Extend COLORS if needed, especially for Occupation bar chart
const EXTENDED_COLORS = [...COLORS, '#a4de6c', '#d0ed57', '#ffc658', '#8dd1e1', '#d4a6c8', '#fb8072'];
// --- NEW Hierarchical Department Data ---
const detailedDepartmentPerformance = [
  // Adult/In-Patient
  { mainDept: 'Adult/In-Patient', subDept: 'Pathological', patients: 550, revenue: 110000, satisfaction: 86 },
  { mainDept: 'Adult/In-Patient', subDept: 'Laboratory', patients: 800, revenue: 90000, satisfaction: 89 },
  { mainDept: 'Adult/In-Patient', subDept: 'Surgery', patients: 350, revenue: 180000, satisfaction: 83 },
  { mainDept: 'Adult/In-Patient', subDept: 'Psychiatric', patients: 180, revenue: 60000, satisfaction: 81 },
  // Pediatrics
  { mainDept: 'Pediatrics', subDept: 'Pathological', patients: 210, revenue: 45000, satisfaction: 91 },
  { mainDept: 'Pediatrics', subDept: 'Laboratory', patients: 450, revenue: 35000, satisfaction: 93 },
  { mainDept: 'Pediatrics', subDept: 'Surgery', patients: 120, revenue: 70000, satisfaction: 88 },
  { mainDept: 'Pediatrics', subDept: 'Psychiatric', patients: 50, revenue: 15000, satisfaction: 85 }, // Less common in Peds example
  // Emergency
  { mainDept: 'Emergency', subDept: 'Pathological', patients: 150, revenue: 50000, satisfaction: 78 },
  { mainDept: 'Emergency', subDept: 'Laboratory', patients: 600, revenue: 75000, satisfaction: 80 },
  { mainDept: 'Emergency', subDept: 'Surgery', patients: 250, revenue: 120000, satisfaction: 75 },
  { mainDept: 'Emergency', subDept: 'Psychiatric', patients: 100, revenue: 30000, satisfaction: 72 },
  // Outpatient
  { mainDept: 'Outpatient', subDept: 'Pathological', patients: 700, revenue: 80000, satisfaction: 88 },
  { mainDept: 'Outpatient', subDept: 'Laboratory', patients: 1200, revenue: 100000, satisfaction: 90 },
  { mainDept: 'Outpatient', subDept: 'Surgery', patients: 150, revenue: 90000, satisfaction: 85 }, // Minor surgeries
  { mainDept: 'Outpatient', subDept: 'Psychiatric', patients: 400, revenue: 95000, satisfaction: 87 },
  // Reg Appointment (Regular Appointment)
  { mainDept: 'Reg Appointment', subDept: 'Pathological', patients: 300, revenue: 40000, satisfaction: 92 },
  { mainDept: 'Reg Appointment', subDept: 'Laboratory', patients: 900, revenue: 60000, satisfaction: 94 },
  // Assuming less Surgery/Psychiatric in regular appt context, adjust as needed
  { mainDept: 'Reg Appointment', subDept: 'Psychiatric', patients: 120, revenue: 25000, satisfaction: 90 },
];

// --- Helper Function to Aggregate Data by Main Department ---
const aggregatePerformanceByMainDept = (data) => {
  // Type guard to ensure data is an array
  if (!Array.isArray(data)) {
    console.error("aggregatePerformanceByMainDept received non-array data:", data);
    return []; // Return empty array if input is invalid
  }

  const aggregation = {};

  data.forEach((item, index) => {
    // --- Input Validation for each item ---
    if (!item || typeof item !== 'object') {
      console.warn(`Invalid item found at index ${index} in department data:`, item);
      return; // Skip this invalid item
    }
    const { mainDept, patients, revenue, satisfaction } = item;

    // Check for essential properties and valid types
    if (typeof mainDept !== 'string' || mainDept.trim() === '') {
      console.warn(`Missing or invalid 'mainDept' at index ${index}:`, item);
      return; // Skip item with invalid main department
    }
    if (typeof patients !== 'number' || isNaN(patients) || patients < 0) {
      console.warn(`Invalid 'patients' value for ${mainDept} at index ${index}:`, item);
      return; // Skip item with invalid patients
    }
    if (typeof revenue !== 'number' || isNaN(revenue)) { // Allow negative revenue? Assuming not for now.
      console.warn(`Invalid 'revenue' value for ${mainDept} at index ${index}:`, item);
      return; // Skip item with invalid revenue
    }
    if (typeof satisfaction !== 'number' || isNaN(satisfaction)) {
      console.warn(`Invalid 'satisfaction' value for ${mainDept} at index ${index}:`, item);
      return; // Skip item with invalid satisfaction
    }
    // --- End Input Validation ---


    // Initialize aggregation object for the main department if it doesn't exist
    if (!aggregation[mainDept]) {
      aggregation[mainDept] = {
        // Store the name explicitly, easier than relying on the key later
        name: mainDept,
        totalPatients: 0,
        totalRevenue: 0,
        // Store the sum of (satisfaction * patients) for weighted average calculation
        weightedSatisfactionSum: 0,
        // Keep track of sub-departments if needed later (optional)
        // subDepts: [],
      };
    }

    // Add current item's values to the totals
    aggregation[mainDept].totalPatients += patients;
    aggregation[mainDept].totalRevenue += revenue;
    // Add the weighted satisfaction score (satisfaction * number of patients)
    aggregation[mainDept].weightedSatisfactionSum += satisfaction * patients;
    // aggregation[mainDept].subDepts.push(item); // Uncomment if you need subDepts later
  });

  // Now, map the aggregated values into the final format
  return Object.values(aggregation).map(dept => {
    const totalPatients = dept.totalPatients;
    const weightedSatisfactionSum = dept.weightedSatisfactionSum;

    // Calculate weighted average satisfaction
    // Guard against division by zero and ensure calculation is valid
    let averageSatisfaction = 0; // Default to 0 if no patients
    if (totalPatients > 0) {
      // Check if the sum is a valid number before dividing
      if (typeof weightedSatisfactionSum === 'number' && !isNaN(weightedSatisfactionSum)) {
        averageSatisfaction = Math.round(weightedSatisfactionSum / totalPatients);
      } else {
        // Handle cases where weighted sum became NaN due to bad input earlier
        console.warn(`Could not calculate average satisfaction for ${dept.name} due to invalid intermediate values.`);
        averageSatisfaction = 0; // Or handle as NaN, null, etc., depending on chart needs
      }
    }

    return {
      name: dept.name,          // Use the stored name
      patients: totalPatients,  // Use the calculated total patients
      revenue: dept.totalRevenue,   // Use the calculated total revenue
      satisfaction: averageSatisfaction, // Use the calculated (and validated) average satisfaction
    };
  });
};
// --- Main Component ---
const HospitalStatistics = () => {
  const [period, setPeriod] = useState("year"); // State for the main period selector
  const [selectedMainDept, setSelectedMainDept] = useState<string | null>(null); // State for selected department view

  // Memoize aggregated data to avoid recalculation on every render
  const aggregatedMainDeptData = useMemo(() => aggregatePerformanceByMainDept(detailedDepartmentPerformance), []);

  // Determine the data to display in the chart based on selection
  const departmentChartData = useMemo(() => {
    if (!selectedMainDept) {
      // Show aggregated main departments
      return aggregatedMainDeptData;
    } else {
      // Show sub-departments for the selected main department
      return detailedDepartmentPerformance.filter(item => item.mainDept === selectedMainDept);
    }
  }, [selectedMainDept, aggregatedMainDeptData]);

  // Determine the key for the XAxis based on the view
  const xAxisDataKey = selectedMainDept ? "subDept" : "name";

  // Calculate total revenue for the card (example based on detailed data)
  const totalDetailedRevenue = useMemo(() =>
    detailedDepartmentPerformance.reduce((sum, item) => sum + item.revenue, 0)
    , []);
  const totalDetailedPatients = useMemo(() =>
    detailedDepartmentPerformance.reduce((sum, item) => sum + item.patients, 0)
    , []);

  // --- Calculate Top Performing Departments (based on aggregated Main Departments) ---
  const topPerformingMainDepts = useMemo(() => {
    return [...aggregatedMainDeptData] // Create a copy to sort
      .sort((a, b) => b.satisfaction - a.satisfaction) // Sort by satisfaction desc
      .slice(0, 3); // Take top 3
  }, [aggregatedMainDeptData]);


  return (
    <div className="container mx-auto py-8">
      {/* --- Header and Period Selector --- */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Hospital Statistics</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* --- Top Cards (Use calculated totals if possible, otherwise keep placeholder) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <CardDescription>Aggregated across departments ({period})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDetailedPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1"> {/* Placeholder change */} +10% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CardDescription>Aggregated across departments ({period})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDetailedRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1"> {/* Placeholder change */} +7.5% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Patient Satisfaction</CardTitle>
            <CardDescription>Weighted average ({period})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* Calculate overall weighted satisfaction */}
              {totalDetailedPatients > 0 ?
                Math.round(detailedDepartmentPerformance.reduce((sum, item) => sum + item.satisfaction * item.patients, 0) / totalDetailedPatients)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground mt-1"> {/* Placeholder change */} +1.8% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Main Tabs --- */}
      <Tabs defaultValue="departments" className="space-y-8"> {/* Changed default tab */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diseases">Common Diseases</TabsTrigger>
          <TabsTrigger value="departments">Department Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="demographics">Patient Demographics</TabsTrigger>
        </TabsList>

        {/* --- Diseases Tab (Unchanged) --- */}
        <TabsContent value="diseases">
          <Card>
            <CardHeader>
              <CardTitle>Most Common Diseases</CardTitle>
              <CardDescription>
                Analysis of disease prevalence ({period})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={diseaseData} // Using original disease data
                    dataKey="count"
                    stroke="#fff"
                    fill="#8884d8"
                    nameKey="name"
                    isAnimationActive={false} // Optional: disable animation if preferred
                  >
                    {/* You might need a custom content renderer if you want tooltips on Treemap */}
                    <Tooltip />
                  </Treemap>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {diseaseData.slice(0, 3).map((disease, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{disease.name}</h4>
                        <span className={`text-sm ${disease.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                          {disease.change}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{disease.department}</span>
                        <span className="font-bold">{disease.count.toLocaleString()} cases</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- MODIFIED Department Performance Tab --- */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>
                    {selectedMainDept ? `${selectedMainDept} - Sub-Department Performance` : 'Overall Department Performance'}
                  </CardTitle>
                  <CardDescription>
                    {selectedMainDept ? `Breakdown for ${selectedMainDept}` : 'Aggregated performance of main departments'} ({period})
                  </CardDescription>
                </div>
                {/* Dropdown to select Main Department View */}
                <Select
                  value={selectedMainDept ?? "overall"} // Use "overall" as value when null
                  onValueChange={(value) => {
                    setSelectedMainDept(value === "overall" ? null : value);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="View Department Details" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overall">Overall Main Departments</SelectItem>
                    {aggregatedMainDeptData.map(dept => (
                      <SelectItem key={dept.name} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chart Area */}
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    {/* Use dynamic dataKey for XAxis */}
                    <XAxis dataKey={xAxisDataKey} />
                    {/* Define Y Axes */}
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Patients', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Satisfaction (%)', angle: 90, position: 'insideRight' }} />
                    <Tooltip formatter={(value, name, props) => {
                      const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
                      if (name === 'satisfaction') return [`${formattedValue}%`, `Satisfaction`];
                      if (name === 'revenue') return [`$${formattedValue}`, `Revenue`]; // Added revenue tooltip formatting
                      if (name === 'patients') return [formattedValue, `Patients`];
                      return [formattedValue, name];
                    }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="patients" fill="#8884d8" name="Patients" />
                    {/* Optionally add Revenue bar if needed, requires another Y axis or different chart type */}
                    {/* <Bar yAxisId="revenue" dataKey="revenue" fill="#ffc658" name="Revenue ($)" /> */}
                    <Bar yAxisId="right" dataKey="satisfaction" fill="#82ca9d" name="Satisfaction (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Performing Departments Section (Based on Main Departments) */}
              {!selectedMainDept && ( // Only show this in the overall view
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Top Performing Main Departments (by Satisfaction)</h4>
                  <div className="space-y-2">
                    {topPerformingMainDepts.map((dept, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <h5 className="font-medium">{dept.name}</h5>
                          <p className="text-sm text-muted-foreground">{dept.patients.toLocaleString()} patients</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(dept.revenue / 1000).toFixed(0)}k revenue</p>
                          <p className="text-sm text-emerald-500">{dept.satisfaction}% satisfaction</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* You could add a similar section here to show details when a specific department IS selected */}
              {selectedMainDept && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Details for {selectedMainDept}</h4>
                  <div className="space-y-2">
                    {departmentChartData.map((subDept, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <h5 className="font-medium">{subDept.subDept}</h5>
                          <p className="text-sm text-muted-foreground">{subDept.patients.toLocaleString()} patients</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${subDept.revenue.toLocaleString()} revenue</p>
                          <p className={`text-sm ${subDept.satisfaction >= 85 ? 'text-emerald-500' : subDept.satisfaction >= 75 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {subDept.satisfaction}% satisfaction
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Revenue Tab (Unchanged) --- */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>
                Monthly revenue and patient trends ({period})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyRevenue} // Using original monthly data
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip formatter={(value, name) => {
                      return name === 'revenue' ? `$${(value as number).toLocaleString()}` : (value as number).toLocaleString();
                    }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="patients" stroke="#82ca9d" name="Patients" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Cards using monthlyRevenue data */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium">Total Annual Revenue</h4>
                    <div className="text-2xl font-bold mt-1">
                      ${monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+8.3% from last year</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium">Average Monthly Revenue</h4>
                    <div className="text-2xl font-bold mt-1">
                      ${Math.round(monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0) / monthlyRevenue.length).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+5.2% from last year</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium">Revenue per Patient (Monthly Avg)</h4>
                    <div className="text-2xl font-bold mt-1">
                      ${(monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0) /
                        monthlyRevenue.reduce((sum, item) => sum + item.patients, 0)).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+3.1% from last year</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Demographics Tab (Unchanged) --- */}
        <TabsContent value="demographics">
          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics & Social Determinants</CardTitle>
              <CardDescription>
                Distribution of patients based on various social determinants of health ({period})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Row 1: Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Birth Location */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Birth Location</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px] p-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={birthLocationData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40} // Doughnut style
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {birthLocationData.map((entry, index) => (
                            <Cell key={`cell-birth-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Growth Location */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Childhood Location</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px] p-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={growthLocationData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {growthLocationData.map((entry, index) => (
                            <Cell key={`cell-growth-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Current Living */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Current Living Area</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px] p-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={currentLivingData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {currentLivingData.map((entry, index) => (
                            <Cell key={`cell-living-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Age & Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age Distribution */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Age Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] p-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ageDemographics} // Using the renamed data
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={true} // Keep line for this one maybe
                        >
                          {ageDemographics.map((entry, index) => (
                            <Cell key={`cell-age-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}%`, `Age ${name}`]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Education Level */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Education Level</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={educationLevelData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" unit="%" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                        <Bar dataKey="value" name="Percentage" fill="#82ca9d">
                          {educationLevelData.map((entry, index) => (
                            <Cell key={`cell-edu-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Occupation & Working Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Occupation */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Occupation Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupationData} margin={{ top: 5, right: 5, left: 5, bottom: 90 }}> {/* Increased bottom margin for rotated labels */}
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          interval={0} // Show all labels
                          angle={-45} // Rotate labels
                          textAnchor="end" // Anchor rotated labels correctly
                          height={10} // Adjust height if needed, but margin handles space
                        />
                        <YAxis unit="%" />
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                        <Bar dataKey="value" name="Percentage" fill="#8884d8">
                          {occupationData.map((entry, index) => (
                            <Cell key={`cell-occ-${index}`} fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Working Conditions */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Reported Working Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[350px] p-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workingConditionsData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}\n(${(percent * 100).toFixed(0)}%)`}
                          labelLine={true}
                        >
                          {workingConditionsData.map((entry, index) => (
                            <Cell key={`cell-work-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Remove or update the old "Key Demographics Insights" section if it existed */}

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HospitalStatistics;