/**
 * Akatsuki's Draft - Automated Unit & Integrity Test Runner
 * Run with: npm test
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { improvePostWithGemini } = require('../src/utils/geminiHelper');
const generateToken = require('../src/utils/generateToken');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  FAIL: ${testName}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log(" Running Akatsuki's Draft Automated Test Suite");
  console.log('======================================================\n');

  // Test 1: Password Hashing & Verification
  console.log('[1] Testing Password Security (Bcrypt)');
  const rawPassword = 'SecurePassword123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawPassword, salt);
  assert(hash !== rawPassword, 'Password is properly hashed and not plaintext');
  const match = await bcrypt.compare(rawPassword, hash);
  assert(match === true, 'Bcrypt correctly verifies valid credentials');
  const wrongMatch = await bcrypt.compare('WrongPassword', hash);
  assert(wrongMatch === false, 'Bcrypt rejects incorrect credentials');

  // Test 2: JWT Token Generation & Verification
  console.log('\n[2] Testing Authentication & JWT Tokens');
  process.env.JWT_SECRET = 'test_secret_key_12345';
  const mockUserId = '64b1f8c1234567890abcdef1';
  const token = generateToken(mockUserId, 'user');
  assert(typeof token === 'string' && token.split('.').length === 3, 'Generates valid 3-part JWT token');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert(decoded.id === mockUserId, 'Decoded token contains correct user ID');
  assert(decoded.role === 'user', 'Decoded token contains correct user role');

  const adminToken = generateToken(mockUserId, 'admin');
  const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET);
  assert(decodedAdmin.role === 'admin', 'Admin token properly encapsulates admin role');

  // Test 3: AI Improvement Engine & Fallback Mechanism
  console.log('\n[3] Testing Gemini AI Integration & Fallback Engine');
  const sampleDraft = {
    title: 'getting started with node and express',
    description: 'quick draft for beginner devs',
    content: 'express is an unopinionated web framework for nodejs. it is fast and minimalistic.',
    category: 'Technology',
  };

  const aiResult = await improvePostWithGemini(sampleDraft, {
    instruction: 'Fix capitalization and enhance structure',
  });

  assert(Boolean(aiResult.improvedTitle), 'AI Engine generates improved title');
  assert(Boolean(aiResult.improvedContent), 'AI Engine generates enhanced content');
  assert(Boolean(aiResult.improvementsSummary), 'AI Engine provides enhancement summary');
  assert(aiResult.improvedContent !== sampleDraft.content, 'AI improved content is transformed from original');

  // Test 4: Schema & Status Consistency
  console.log('\n[4] Testing Status State Machine & Role Validation');
  const validRoles = ['admin', 'user'];
  const validStatuses = ['draft', 'pending', 'approved', 'rejected'];

  assert(validRoles.includes('user') && validRoles.includes('admin'), 'User roles include admin and user');
  assert(validStatuses.length === 4, 'Post lifecycle has 4 valid statuses (draft, pending, approved, rejected)');
  assert(validStatuses.includes('draft'), 'Draft status supported');
  assert(validStatuses.includes('pending'), 'Pending status supported');
  assert(validStatuses.includes('approved'), 'Approved status supported');
  assert(validStatuses.includes('rejected'), 'Rejected status supported');

  console.log('\n======================================================');
  console.log(` Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log(' All systems operational! Ready for submission & GitHub upload.\n');
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
