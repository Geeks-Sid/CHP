/**
 * Sample Data Generation Script
 * 
 * Generates realistic sample data for development and demo purposes:
 * - ~100 persons (patients)
 * - ~200-300 visits
 * - Associated procedures and medications
 * - Various visit types and date ranges
 * 
 * Usage:
 *   ts-node database/scripts/generate-sample-data.ts
 * 
 * Or with environment variables:
 *   PGHOST=localhost PGPORT=5432 PGDATABASE=hospital PGUSER=hospital PGPASSWORD=password \
 *   ts-node database/scripts/generate-sample-data.ts
 */

import { Pool } from 'pg';
import * as crypto from 'crypto';

// Configuration
const CONFIG = {
  PERSONS_COUNT: 100,
  VISITS_PER_PERSON_MIN: 1,
  VISITS_PER_PERSON_MAX: 5,
  PROCEDURES_PER_VISIT_MIN: 0,
  PROCEDURES_PER_VISIT_MAX: 3,
  MEDICATIONS_PER_VISIT_MIN: 0,
  MEDICATIONS_PER_VISIT_MAX: 4,
};

// Sample data pools
const FIRST_NAMES = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica',
  'Robert', 'Ashley', 'William', 'Amanda', 'Richard', 'Melissa', 'Joseph', 'Deborah',
  'Thomas', 'Michelle', 'Charles', 'Laura', 'Christopher', 'Kimberly', 'Daniel', 'Amy',
  'Matthew', 'Angela', 'Anthony', 'Sharon', 'Mark', 'Lisa', 'Donald', 'Nancy',
  'Steven', 'Karen', 'Paul', 'Betty', 'Andrew', 'Helen', 'Joshua', 'Sandra',
  'Kenneth', 'Donna', 'Kevin', 'Carol', 'Brian', 'Ruth', 'George', 'Sharon',
  'Edward', 'Michelle', 'Ronald', 'Laura', 'Timothy', 'Sarah', 'Jason', 'Kimberly',
  'Jeffrey', 'Deborah', 'Ryan', 'Jessica', 'Jacob', 'Shirley', 'Gary', 'Cynthia',
  'Nicholas', 'Angela', 'Eric', 'Melissa', 'Jonathan', 'Brenda', 'Stephen', 'Emma',
  'Larry', 'Olivia', 'Justin', 'Catherine', 'Scott', 'Amy', 'Brandon', 'Anna',
  'Benjamin', 'Rebecca', 'Samuel', 'Virginia', 'Frank', 'Kathleen', 'Gregory', 'Pamela',
  'Raymond', 'Martha', 'Alexander', 'Debra', 'Patrick', 'Amanda', 'Jack', 'Stephanie',
  'Dennis', 'Carolyn', 'Jerry', 'Christine', 'Tyler', 'Marie', 'Aaron', 'Janet',
  'Jose', 'Catherine', 'Henry', 'Frances', 'Adam', 'Ann', 'Douglas', 'Joyce',
  'Nathan', 'Diane', 'Zachary', 'Alice', 'Kyle', 'Julie', 'Noah', 'Heather',
  'Ethan', 'Teresa', 'Jeremy', 'Doris', 'Christian', 'Gloria', 'Keith', 'Evelyn',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
  'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards',
  'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers',
  'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly',
  'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks',
  'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross',
  'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell',
  'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher', 'Vasquez', 'Simmons',
];

const GENDERS = [
  { concept_id: 8507, name: 'Male' },
  { concept_id: 8532, name: 'Female' },
];

const RACES = [
  { concept_id: 8527, name: 'White' },
  { concept_id: 8516, name: 'Black or African American' },
  { concept_id: 8515, name: 'Asian' },
  { concept_id: 8557, name: 'Native Hawaiian or Other Pacific Islander' },
  { concept_id: 8657, name: 'American Indian or Alaska Native' },
];

const VISIT_TYPES = ['OPD', 'IPD', 'ER'] as const;
const VISIT_CONCEPTS = [9201, 9202, 9203]; // Outpatient, Inpatient, Emergency

const PROCEDURE_CONCEPTS = [
  2000001, 2000002, 2000003, 2000004, 2000005, // Example procedure codes
];

const DRUG_CONCEPTS = [
  19122137, 19122138, 19122139, 19122140, // Example drug codes
];

const DRUG_TYPES = [38000177, 38000178]; // Prescription written, etc.

/**
 * Generate random date between start and end
 */
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random element from array
 */
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate MRN
 */
function generateMRN(year: number, sequence: number): string {
  return `MRN-${year}-${String(sequence).padStart(6, '0')}`;
}

/**
 * Generate visit number
 */
function generateVisitNumber(year: number, sequence: number): string {
  return `V-${year}-${String(sequence).padStart(6, '0')}`;
}

/**
 * Main function to generate sample data
 */
async function generateSampleData() {
  const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'hospital',
    user: process.env.PGUSER || 'hospital',
    password: process.env.PGPASSWORD || 'password',
  });

  try {
    console.log('Starting sample data generation...');

    // Generate persons
    console.log(`Generating ${CONFIG.PERSONS_COUNT} persons...`);
    const persons: Array<{ person_id: number; mrn: string }> = [];

    for (let i = 0; i < CONFIG.PERSONS_COUNT; i++) {
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const gender = randomElement(GENDERS);
      const race = randomElement(RACES);

      // Generate birth date (between 18 and 80 years ago)
      const birthYear = new Date().getFullYear() - randomInt(18, 80);
      const birthMonth = randomInt(1, 12);
      const birthDay = randomInt(1, 28); // Use 28 to avoid month-end issues
      const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

      const mrn = generateMRN(birthYear, i + 1);

      const result = await pool.query(
        `INSERT INTO person (
          first_name, last_name, gender_concept_id,
          year_of_birth, month_of_birth, day_of_birth, birth_datetime,
          race_concept_id, ethnicity_concept_id, mrn
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING person_id, mrn`,
        [
          firstName,
          lastName,
          gender.concept_id,
          birthYear,
          birthMonth,
          birthDay,
          birthDate.toISOString(),
          race.concept_id,
          38003564, // Not Hispanic or Latino (default)
          mrn,
        ],
      );

      persons.push(result.rows[0]);
    }

    console.log(`Generated ${persons.length} persons`);

    // Generate visits
    console.log('Generating visits...');
    let visitSequence = 1;
    const visits: Array<{ visit_occurrence_id: number; person_id: number }> = [];

    for (const person of persons) {
      const visitCount = randomInt(
        CONFIG.VISITS_PER_PERSON_MIN,
        CONFIG.VISITS_PER_PERSON_MAX,
      );

      for (let j = 0; j < visitCount; j++) {
        const visitType = randomElement(VISIT_TYPES);
        const visitConceptId = VISIT_CONCEPTS[VISIT_TYPES.indexOf(visitType)];

        // Generate visit date (between 1 year ago and now)
        const visitStart = randomDate(
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          new Date(),
        );

        // For IPD, visits can be longer; for OPD/ER, usually same day
        let visitEnd: Date | null = null;
        if (visitType === 'IPD') {
          // IPD visits: 1-14 days
          visitEnd = new Date(visitStart.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000);
        } else {
          // OPD/ER: same day, 1-8 hours
          visitEnd = new Date(visitStart.getTime() + randomInt(1, 8) * 60 * 60 * 1000);
        }

        const visitNumber = generateVisitNumber(visitStart.getFullYear(), visitSequence++);

        const result = await pool.query(
          `INSERT INTO visit_occurrence (
            person_id, visit_concept_id, visit_start, visit_end,
            visit_type, department_id, visit_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING visit_occurrence_id, person_id`,
          [
            person.person_id,
            visitConceptId,
            visitStart.toISOString(),
            visitEnd.toISOString(),
            visitType,
            randomInt(1, 10), // Random department
            visitNumber,
          ],
        );

        visits.push(result.rows[0]);
      }
    }

    console.log(`Generated ${visits.length} visits`);

    // Generate procedures
    console.log('Generating procedures...');
    let procedureCount = 0;

    for (const visit of visits) {
      const procedureCountForVisit = randomInt(
        CONFIG.PROCEDURES_PER_VISIT_MIN,
        CONFIG.PROCEDURES_PER_VISIT_MAX,
      );

      for (let k = 0; k < procedureCountForVisit; k++) {
        await pool.query(
          `INSERT INTO procedure_occurrence (
            person_id, procedure_concept_id, procedure_date,
            procedure_type_concept_id, visit_occurrence_id
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            visit.person_id,
            randomElement(PROCEDURE_CONCEPTS),
            visit.visit_start, // Procedure on visit date
            4478661, // Inpatient procedure
            visit.visit_occurrence_id,
          ],
        );
        procedureCount++;
      }
    }

    console.log(`Generated ${procedureCount} procedures`);

    // Generate medications
    console.log('Generating medications...');
    let medicationCount = 0;

    for (const visit of visits) {
      const medicationCountForVisit = randomInt(
        CONFIG.MEDICATIONS_PER_VISIT_MIN,
        CONFIG.MEDICATIONS_PER_VISIT_MAX,
      );

      for (let k = 0; k < medicationCountForVisit; k++) {
        const drugStart = new Date(visit.visit_start);
        // Medications typically last 7-30 days
        const drugEnd = new Date(
          drugStart.getTime() + randomInt(7, 30) * 24 * 60 * 60 * 1000,
        );

        await pool.query(
          `INSERT INTO drug_exposure (
            person_id, drug_concept_id, drug_exposure_start, drug_exposure_end,
            drug_type_concept_id, visit_occurrence_id, quantity, instructions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            visit.person_id,
            randomElement(DRUG_CONCEPTS),
            drugStart.toISOString(),
            drugEnd.toISOString(),
            randomElement(DRUG_TYPES),
            visit.visit_occurrence_id,
            randomInt(10, 100), // Quantity
            'Take as directed',
          ],
        );
        medicationCount++;
      }
    }

    console.log(`Generated ${medicationCount} medications`);

    console.log('\n✅ Sample data generation complete!');
    console.log(`   - Persons: ${persons.length}`);
    console.log(`   - Visits: ${visits.length}`);
    console.log(`   - Procedures: ${procedureCount}`);
    console.log(`   - Medications: ${medicationCount}`);
  } catch (error) {
    console.error('Error generating sample data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  generateSampleData().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { generateSampleData };

