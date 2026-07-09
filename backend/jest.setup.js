// Provide a valid-length JWT_SECRET for the test environment so modules that
// validate it at import time (src/utils/jwt.ts) don't process.exit during
// test collection. Production still requires this to be set explicitly and
// still enforces the same minimum length -- this only unblocks tests.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = "test-jwt-secret-for-unit-tests-only-not-real";
}
