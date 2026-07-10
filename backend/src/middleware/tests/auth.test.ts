import { Response, NextFunction } from "express";
import { authenticate, AuthRequest } from "../auth";
import * as jwtUtils from "../../utils/jwt";
import User from "../../models/User";
import BlacklistedToken from "../../models/BlacklistedToken";

jest.mock("../../models/User");
jest.mock("../../models/BlacklistedToken");
jest.mock("../../utils/jwt");

const mockedUser = User as jest.Mocked<typeof User>;
const mockedBlacklistedToken = BlacklistedToken as jest.Mocked<typeof BlacklistedToken>;
const mockedVerifyToken = jwtUtils.verifyToken as jest.Mock;

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe("authenticate middleware", () => {
    let next: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();
        next = jest.fn();
        (mockedBlacklistedToken.findOne as jest.Mock).mockResolvedValue(null);
    });

    it("should reject a token issued before passwordChangedAt", async () => {
        const passwordChangedAt = new Date();
        const issuedAtSeconds = Math.floor(passwordChangedAt.getTime() / 1000) - 60; // issued 60s before the change

        mockedVerifyToken.mockReturnValue({
            userId: "user1",
            email: "a@example.com",
            userType: "intern",
            iat: issuedAtSeconds,
        });

        (mockedUser.findById as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: "user1",
                isActive: true,
                passwordChangedAt,
            }),
        });

        const req = {
            headers: { authorization: "Bearer sometoken" },
            cookies: {},
        } as unknown as AuthRequest;
        const res = mockResponse();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Password was changed. Please log in again.",
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should allow a token issued after passwordChangedAt", async () => {
        const passwordChangedAt = new Date(Date.now() - 60_000); // changed 60s ago
        const issuedAtSeconds = Math.floor(Date.now() / 1000); // issued just now

        mockedVerifyToken.mockReturnValue({
            userId: "user1",
            email: "a@example.com",
            userType: "intern",
            iat: issuedAtSeconds,
        });

        (mockedUser.findById as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: "user1",
                isActive: true,
                passwordChangedAt,
            }),
        });

        const req = {
            headers: { authorization: "Bearer sometoken" },
            cookies: {},
        } as unknown as AuthRequest;
        const res = mockResponse();

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalledWith(401);
    });

    it("should allow a token when passwordChangedAt was never set", async () => {
        mockedVerifyToken.mockReturnValue({
            userId: "user1",
            email: "a@example.com",
            userType: "intern",
            iat: Math.floor(Date.now() / 1000),
        });

        (mockedUser.findById as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: "user1",
                isActive: true,
                passwordChangedAt: undefined,
            }),
        });

        const req = {
            headers: { authorization: "Bearer sometoken" },
            cookies: {},
        } as unknown as AuthRequest;
        const res = mockResponse();

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalledWith(401);
    });
});