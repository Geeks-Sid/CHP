/**
 * k6 Load Testing Scenarios
 * 
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run tests/load/k6-scenarios.js
 * 
 * Environment variables:
 * - BASE_URL: API base URL (default: http://localhost:3000)
 * - VUS: Virtual users (default: 10)
 * - DURATION: Test duration (default: 30s)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authResponseTime = new Trend('auth_response_time');
const patientResponseTime = new Trend('patient_response_time');
const visitResponseTime = new Trend('visit_response_time');

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate should be less than 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
let authToken = '';

// Setup: Login and get token
export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    username: 'admin',
    password: 'ChangeMe123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return { token: body.accessToken };
  }

  return { token: null };
}

export default function (data) {
  const token = data.token;

  // Scenario 1: Authentication
  if (Math.random() < 0.1) {
    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
      username: 'testuser',
      password: 'TestPassword123!',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(loginRes, {
      'auth status is 200': (r) => r.status === 200,
      'auth has access token': (r) => {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined;
      },
    });

    errorRate.add(!success);
    authResponseTime.add(loginRes.timings.duration);
  }

  // Scenario 2: Patient Operations
  if (token && Math.random() < 0.3) {
    // List patients
    const listRes = http.get(`${BASE_URL}/api/v1/patients?limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const success = check(listRes, {
      'patient list status is 200': (r) => r.status === 200,
      'patient list has items': (r) => {
        const body = JSON.parse(r.body);
        return Array.isArray(body.items);
      },
    });

    errorRate.add(!success);
    patientResponseTime.add(listRes.timings.duration);
  }

  // Scenario 3: Visit Operations
  if (token && Math.random() < 0.2) {
    // List visits
    const listRes = http.get(`${BASE_URL}/api/v1/visits?limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const success = check(listRes, {
      'visit list status is 200': (r) => r.status === 200,
      'visit list has items': (r) => {
        const body = JSON.parse(r.body);
        return Array.isArray(body.items);
      },
    });

    errorRate.add(!success);
    visitResponseTime.add(listRes.timings.duration);
  }

  // Scenario 4: Terminology Lookup
  if (token && Math.random() < 0.2) {
    const searchRes = http.get(`${BASE_URL}/api/v1/terminology/concepts?q=diabetes&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    check(searchRes, {
      'terminology search status is 200': (r) => r.status === 200,
    });
  }

  sleep(1); // Think time between requests
}

export function teardown(data) {
  // Cleanup if needed
}

