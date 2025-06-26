import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

// Custom metrics
export const requests = new Counter('http_reqs')
export const failureRate = new Rate('failed_requests')
export const successRate = new Rate('successful_requests')
export const apiResponseTime = new Trend('api_response_time')

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    successful_requests: ['rate>0.9'], // Success rate must be above 90%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Test data
const testUsers = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  { email: 'loadtest2@example.com', password: 'LoadTest123!' },
  { email: 'loadtest3@example.com', password: 'LoadTest123!' },
]

const testOrgs = ['org-load-1', 'org-load-2', 'org-load-3']

export function setup() {
  // Setup test data
  console.log('Setting up load test data...')
  
  // Create test users and organizations
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i]
    const response = http.post(`${BASE_URL}/api/create-test-user`, {
      email: user.email,
      password: user.password,
      orgName: `Load Test Org ${i + 1}`,
      orgId: testOrgs[i]
    })
    
    check(response, {
      'test user created': (r) => r.status === 201,
    })
  }
  
  return { users: testUsers, orgs: testOrgs }
}

export default function(data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)]
  const orgId = data.orgs[Math.floor(Math.random() * data.orgs.length)]
  
  // 1. Authentication flow
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: user.password,
  })
  
  const loginSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response time OK': (r) => r.timings.duration < 2000,
  })
  
  successRate.add(loginSuccess)
  failureRate.add(!loginSuccess)
  apiResponseTime.add(loginResponse.timings.duration)
  
  if (!loginSuccess) {
    return
  }
  
  const authToken = loginResponse.json('token')
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  }
  
  sleep(1)
  
  // 2. Dashboard data loading
  const dashboardResponse = http.get(`${BASE_URL}/org/${orgId}/dashboard`, {
    headers,
  })
  
  check(dashboardResponse, {
    'dashboard loads': (r) => r.status === 200,
    'dashboard response time OK': (r) => r.timings.duration < 1500,
  })
  
  sleep(1)
  
  // 3. Data upload simulation
  const csvData = generateTestCSV(100)
  const uploadResponse = http.post(`${BASE_URL}/api/data/upload`, {
    file: http.file(csvData, 'test-data.csv', 'text/csv'),
    orgId: orgId,
  }, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  })
  
  const uploadSuccess = check(uploadResponse, {
    'data upload successful': (r) => r.status === 200,
    'upload response time OK': (r) => r.timings.duration < 5000,
  })
  
  successRate.add(uploadSuccess)
  failureRate.add(!uploadSuccess)
  
  sleep(2)
  
  // 4. Data querying
  const dataResponse = http.get(`${BASE_URL}/api/data/imports?orgId=${orgId}&limit=50`, {
    headers,
  })
  
  check(dataResponse, {
    'data query successful': (r) => r.status === 200,
    'data query response time OK': (r) => r.timings.duration < 1000,
  })
  
  sleep(1)
  
  // 5. Report generation
  const reportResponse = http.post(`${BASE_URL}/api/reports/generate`, {
    orgId: orgId,
    type: 'monthly_summary',
    dateRange: {
      start: '2024-01-01',
      end: '2024-12-31',
    },
  }, {
    headers,
  })
  
  check(reportResponse, {
    'report generation successful': (r) => r.status === 200,
    'report response time OK': (r) => r.timings.duration < 3000,
  })
  
  sleep(1)
  
  // 6. Integration operations
  const integrationsResponse = http.get(`${BASE_URL}/api/integrations/google?orgId=${orgId}`, {
    headers,
  })
  
  check(integrationsResponse, {
    'integrations load': (r) => r.status === 200,
    'integrations response time OK': (r) => r.timings.duration < 800,
  })
  
  sleep(2)
}

export function teardown(data) {
  console.log('Cleaning up load test data...')
  
  // Clean up test data
  for (const orgId of data.orgs) {
    http.del(`${BASE_URL}/api/test-cleanup/${orgId}`)
  }
}

// Helper functions
function generateTestCSV(rows) {
  let csv = 'Date,Description,Amount,Category\n'
  
  for (let i = 0; i < rows; i++) {
    const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    const amount = (Math.random() * 1000 - 500).toFixed(2)
    const descriptions = ['Grocery Store', 'Gas Station', 'Restaurant', 'Online Purchase', 'Salary', 'Rent']
    const categories = ['Food', 'Transportation', 'Entertainment', 'Housing', 'Income', 'Utilities']
    
    csv += `${date.toISOString().split('T')[0]},${descriptions[Math.floor(Math.random() * descriptions.length)]},${amount},${categories[Math.floor(Math.random() * categories.length)]}\n`
  }
  
  return csv
}

// Spike test configuration
export const spikeOptions = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '10s', target: 200 }, // Spike to 200 users
    { duration: '30s', target: 200 },
    { duration: '10s', target: 10 }, // Back to normal
    { duration: '1m', target: 10 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // More lenient during spike
    http_req_failed: ['rate<0.2'], // Allow higher error rate during spike
  },
}

// Stress test configuration
export const stressOptions = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '2m', target: 400 },
    { duration: '5m', target: 400 },
    { duration: '10m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.3'],
  },
} 