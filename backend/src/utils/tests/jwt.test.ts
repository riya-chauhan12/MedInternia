import { assertValidSecret } from "../jwt";

describe("assertValidSecret", () => {
    it("throws when the secret is undefined", () => {
        expect(() => assertValidSecret("JWT_SECRET", undefined)).toThrow(
            /must be set to a secure random value/
        );
    });

    it("throws when the secret is an empty string", () => {
        expect(() => assertValidSecret("JWT_SECRET", "")).toThrow(
            /must be set to a secure random value/
        );
    });

    it("throws when the secret is the documented fallback value", () => {
        expect(() => assertValidSecret("JWT_SECRET", "fallback_secret")).toThrow(
            /must be set to a secure random value/
        );
    });

    it("throws when the secret is shorter than 32 characters", () => {
        expect(() => assertValidSecret("JWT_SECRET", "short-secret")).toThrow(
            /must be at least 32 characters long/
        );
    });

    it("does not throw for a secret of exactly 32 characters", () => {
        const secret = "a".repeat(32);
        expect(() => assertValidSecret("JWT_SECRET", secret)).not.toThrow();
    });

    it("does not throw for a secret longer than 32 characters", () => {
        const secret = "a".repeat(64);
        expect(() => assertValidSecret("JWT_SECRET", secret)).not.toThrow();
    });

    it("includes the provided variable name in the error message", () => {
        expect(() => assertValidSecret("JWT_REFRESH_SECRET", "too-short")).toThrow(
            /JWT_REFRESH_SECRET/
        );
    });
});
