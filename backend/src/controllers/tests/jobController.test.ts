import { Response } from "express";
import { updateJobOpportunity, deleteJobOpportunity, calculateMatchScore } from "../jobController";
import { AuthRequest } from "../../middleware/auth";
import JobOpportunity from "../../models/JobOpportunity";

jest.mock("../../models/JobOpportunity");

const mockedJobOpportunity = JobOpportunity as jest.Mocked<typeof JobOpportunity>;

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockRequest = (id: string, userId: string, body: Record<string, unknown> = {}): AuthRequest =>
    ({
        params: { id },
        body,
        user: { _id: userId } as any,
    }) as unknown as AuthRequest;

// Regression coverage for issue #410 (IDOR on job board endpoints): update
// and delete must filter by { _id, postedBy } together, not just _id, so a
// caller cannot mutate or remove another user's job posting by guessing its
// ID. These tests pin the ownership filter down at the query level -- not
// just the eventual response -- so a future refactor that drops the
// postedBy clause fails immediately rather than only under a live database.

describe("Job Controller ownership checks (issue #410)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("updateJobOpportunity", () => {
        it("queries with both _id and postedBy in the same filter", async () => {
            (mockedJobOpportunity.findOne as jest.Mock).mockResolvedValue(null);

            const req = mockRequest("job-123", "user-a", { title: "Hacked" });
            const res = mockResponse();

            await updateJobOpportunity(req, res);

            expect(mockedJobOpportunity.findOne).toHaveBeenCalledWith({
                _id: "job-123",
                postedBy: "user-a",
            });
        });

        it("returns 404 without mutating when the job is not owned by the caller", async () => {
            (mockedJobOpportunity.findOne as jest.Mock).mockResolvedValue(null);

            const req = mockRequest("victim-job", "attacker", { title: "Hacked", salary: "0" });
            const res = mockResponse();

            await updateJobOpportunity(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false })
            );
        });

        it("updates the job when the caller is the owner", async () => {
            const save = jest.fn().mockResolvedValue(undefined);
            const populate = jest.fn().mockResolvedValue(undefined);
            const job: Record<string, unknown> = { title: "Old title", save, populate };
            (mockedJobOpportunity.findOne as jest.Mock).mockResolvedValue(job);

            const req = mockRequest("job-123", "owner-1", { title: "New title" });
            const res = mockResponse();

            await updateJobOpportunity(req, res);

            expect(job.title).toBe("New title");
            expect(save).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalledWith(404);
        });
    });

    describe("deleteJobOpportunity", () => {
        it("queries with both _id and postedBy in the same filter", async () => {
            (mockedJobOpportunity.findOne as jest.Mock).mockResolvedValue(null);

            const req = mockRequest("job-123", "user-a");
            const res = mockResponse();

            await deleteJobOpportunity(req, res);

            expect(mockedJobOpportunity.findOne).toHaveBeenCalledWith({
                _id: "job-123",
                postedBy: "user-a",
            });
        });

        it("returns 404 and does not call findByIdAndDelete when not owned by the caller", async () => {
            (mockedJobOpportunity.findOne as jest.Mock).mockResolvedValue(null);

            const req = mockRequest("victim-job", "attacker");
            const res = mockResponse();

            await deleteJobOpportunity(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(mockedJobOpportunity.findByIdAndDelete).not.toHaveBeenCalled();
        });

        it("deletes the job when the caller is the owner", async () => {
            (mockedJobOpportunity.findOne as jest.Mock).mockResolvedValue({ _id: "job-123" });
            (mockedJobOpportunity.findByIdAndDelete as jest.Mock).mockResolvedValue({});

            const req = mockRequest("job-123", "owner-1");
            const res = mockResponse();

            await deleteJobOpportunity(req, res);

            expect(mockedJobOpportunity.findByIdAndDelete).toHaveBeenCalledWith("job-123");
            expect(res.status).not.toHaveBeenCalledWith(404);
        });
    });

    describe("calculateMatchScore", () => {
        it("returns 100% match when user meets all requirements", () => {
            const user = {
                skills: ["surgery", "cpr"],
                interests: ["pediatrics"],
                experience: 3,
                medicalSchool: "Harvard Medical School"
            };
            const job = {
                requirements: {
                    skills: ["surgery"],
                    yearsOfExperience: 2,
                    education: "Medical School"
                }
            };
            const score = calculateMatchScore(user, job);
            expect(score).toBe(100);
        });

        it("scales scoring correctly based on partial matches", () => {
            const user = {
                skills: ["cpr"],
                experience: 1,
                medicalSchool: "Harvard Medical School"
            };
            const job = {
                requirements: {
                    skills: ["surgery", "cpr"], // 1 of 2 matches = 50% * 0.6 = 30%
                    yearsOfExperience: 2,       // 1 of 2 experience = 50% * 0.2 = 10%
                    education: "Medical School" // matches = 100% * 0.2 = 20%
                }
            };
            const score = calculateMatchScore(user, job);
            expect(score).toBe(60); // 30% + 10% + 20% = 60%
        });

        it("handles missing requirements or empty user fields gracefully", () => {
            const user = {};
            const job = {};
            const score = calculateMatchScore(user, job);
            expect(score).toBe(100); // Defaults to 100 if no requirements specified
        });
    });
});
