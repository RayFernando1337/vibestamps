// Simple test script to verify Zod schema validation
const { generateApiRequestSchema, timestampsOutputSchema } = require("./lib/schemas.ts");

console.log("Testing Zod Schema Validation for Timestamp Count Feature");

// Test 1: Valid API request with timestamp count
console.log("\n1. Testing valid API request:");
const validRequest = {
  srtContent:
    "1\n00:00:00,000 --> 00:00:05,000\nHello world\n\n2\n00:00:05,000 --> 00:00:10,000\nThis is a test",
  timestampCount: 8,
};

const requestResult = generateApiRequestSchema.safeParse(validRequest);
console.log("Valid request result:", requestResult.success ? "✅ PASSED" : "❌ FAILED");
if (!requestResult.success) {
  console.log("Errors:", requestResult.error.errors);
}

// Test 2: Invalid timestamp count (too low)
console.log("\n2. Testing invalid timestamp count (too low):");
const invalidRequestLow = {
  srtContent: "1\n00:00:00,000 --> 00:00:05,000\nHello world",
  timestampCount: 2, // Should fail - minimum is 3
};

const lowResult = generateApiRequestSchema.safeParse(invalidRequestLow);
console.log(
  "Low count result:",
  lowResult.success ? "❌ SHOULD HAVE FAILED" : "✅ CORRECTLY FAILED"
);
if (!lowResult.success) {
  console.log("Expected error:", lowResult.error.errors[0].message);
}

// Test 3: Invalid timestamp count (too high)
console.log("\n3. Testing invalid timestamp count (too high):");
const invalidRequestHigh = {
  srtContent: "1\n00:00:00,000 --> 00:00:05,000\nHello world",
  timestampCount: 30, // Should fail - maximum is 25
};

const highResult = generateApiRequestSchema.safeParse(invalidRequestHigh);
console.log(
  "High count result:",
  highResult.success ? "❌ SHOULD HAVE FAILED" : "✅ CORRECTLY FAILED"
);
if (!highResult.success) {
  console.log("Expected error:", highResult.error.errors[0].message);
}

// Test 4: Default timestamp count
console.log("\n4. Testing default timestamp count:");
const defaultRequest = {
  srtContent: "1\n00:00:00,000 --> 00:00:05,000\nHello world",
  // timestampCount not provided - should default to 8
};

const defaultResult = generateApiRequestSchema.safeParse(defaultRequest);
console.log("Default count result:", defaultResult.success ? "✅ PASSED" : "❌ FAILED");
if (defaultResult.success) {
  console.log("Default timestamp count:", defaultResult.data.timestampCount);
}

// Test 5: Valid timestamp output
console.log("\n5. Testing valid timestamp output:");
const validOutput = {
  timestamps: [
    { time: "00:00", description: "Introduction" },
    { time: "02:30", description: "Key concept explanation" },
    { time: "05:45", description: "Example demonstration" },
    { time: "08:20", description: "Advanced features" },
    { time: "10:15", description: "Best practices" },
    { time: "12:30", description: "Common mistakes" },
    { time: "14:45", description: "Tips and tricks" },
    { time: "16:30", description: "Conclusion" },
  ],
  requestedCount: 8,
  actualCount: 8,
  videoMaxTime: "17:00",
};

const outputResult = timestampsOutputSchema.safeParse(validOutput);
console.log("Valid output result:", outputResult.success ? "✅ PASSED" : "❌ FAILED");
if (!outputResult.success) {
  console.log("Errors:", outputResult.error.errors);
}

// Test 6: Output with count mismatch (should still pass within tolerance)
console.log("\n6. Testing output with slight count mismatch:");
const mismatchOutput = {
  timestamps: [
    { time: "00:00", description: "Introduction" },
    { time: "02:30", description: "Key concept" },
    { time: "05:45", description: "Example" },
    { time: "08:20", description: "Advanced" },
    { time: "10:15", description: "Best practices" },
    { time: "12:30", description: "Common mistakes" },
    { time: "14:45", description: "Conclusion" }, // 7 instead of 8
  ],
  requestedCount: 8,
  actualCount: 7,
  videoMaxTime: "15:00",
};

const mismatchResult = timestampsOutputSchema.safeParse(mismatchOutput);
console.log(
  "Mismatch count result:",
  mismatchResult.success ? "✅ PASSED (within tolerance)" : "❌ FAILED"
);
if (!mismatchResult.success) {
  console.log("Errors:", mismatchResult.error.errors);
}

console.log("\n🎉 Schema validation tests completed!");
