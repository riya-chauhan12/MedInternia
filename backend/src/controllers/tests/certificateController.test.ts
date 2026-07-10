import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
    getCertificateById,
    verifyCertificate,
    exportCertificateData,
} from "../certificateController";

import Certificate from "../../models/Certificate";

jest.mock("../../models/Certificate");

const mockedCertificate = Certificate as jest.Mocked<typeof Certificate>;

const mockResponse = () => {
    const res: Partial<Response> = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res as Response;
};

describe("Certificate Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getCertificateById", () => {
        it("should return 404 when certificate is not found", async () => {
            const populate2 = jest.fn().mockResolvedValue(null);

            const populate1 = jest.fn().mockReturnValue({
                populate: populate2,
            });

            (mockedCertificate.findOne as jest.Mock).mockReturnValue({
                populate: populate1,
            });

            const req = {
                params: { certificateId: "CERT-123" },
            } as unknown as AuthRequest;

            const res = mockResponse();

            await getCertificateById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Certificate not found",
                })
            );
        });

        it("should NOT include intern email for an unrelated logged-in user", async () => {
            const fakeCert = {
                certificateId: "CERT-123",
                title: "Great Work",
                intern: { _id: "internId1", firstName: "Alice", lastName: "A", email: "alice@example.com" },
                doctor: { _id: "doctorId1", firstName: "Dr", lastName: "Bob", specialization: "Cardiology", isVerifiedDoctor: true },
                casesReviewed: 5,
                pointsEarned: 50,
                createdAt: new Date(),
                isVerified: true,
                downloadCount: 0,
                save: jest.fn().mockResolvedValue(true),
            };

            const populate2 = jest.fn().mockResolvedValue(fakeCert);
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            (mockedCertificate.findOne as jest.Mock).mockReturnValue({ populate: populate1 });

            const req = {
                params: { certificateId: "CERT-123" },
                user: { _id: "unrelatedUserId", userType: "intern" },
            } as unknown as AuthRequest;

            const res = mockResponse();

            await getCertificateById(req, res);

            const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
            expect(jsonArg.data.certificate.intern.email).toBeUndefined();
            expect(jsonArg.data.certificate.intern.firstName).toBe("Alice");
        });

        it("should flag isRevoked true when certificate is not verified", async () => {
            const fakeCert = {
                certificateId: "CERT-123",
                title: "Great Work",
                intern: { _id: "internId1", firstName: "Alice", lastName: "A", email: "alice@example.com" },
                doctor: { _id: "doctorId1", firstName: "Dr", lastName: "Bob", specialization: "Cardiology", isVerifiedDoctor: true },
                casesReviewed: 5,
                pointsEarned: 50,
                createdAt: new Date(),
                isVerified: false,
                downloadCount: 0,
                save: jest.fn().mockResolvedValue(true),
            };

            const populate2 = jest.fn().mockResolvedValue(fakeCert);
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            (mockedCertificate.findOne as jest.Mock).mockReturnValue({ populate: populate1 });

            const req = {
                params: { certificateId: "CERT-123" },
                user: { _id: "unrelatedUserId", userType: "intern" },
            } as unknown as AuthRequest;

            const res = mockResponse();

            await getCertificateById(req, res);

            const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
            expect(jsonArg.data.isRevoked).toBe(true);
        });
    });

    describe("verifyCertificate", () => {
        it("should return invalid verification response when certificate does not exist", async () => {
            (mockedCertificate.findOne as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            const req = {
                body: {
                    certificateId: "CERT-123",
                    verificationHash: "invalid",
                },
            } as Request;

            const res = mockResponse();

            await verifyCertificate(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    data: {
                        isValid: false,
                    },
                })
            );
        });
    });

    describe("exportCertificateData", () => {
        it("should return 404 when certificate is not found", async () => {
            const populateDoctor = jest.fn().mockResolvedValue(null);

            const populateMock = jest.fn();

            populateMock
                .mockReturnValueOnce({
                    populate: populateMock,
                })
                .mockResolvedValueOnce(null);

            (mockedCertificate.findOne as jest.Mock).mockReturnValue({
                populate: populateMock,
            });


            const req = {
                params: {
                    certificateId: "CERT-123",
                },
            } as unknown as Request;

            const res = mockResponse();

            await exportCertificateData(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                })
            );
        });
    });
});