import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  getLeaderboard,
  getDoctorMentorSummary,
  updateUserStreak,
} from "../userController";
import User from "../../models/User";
import Case from "../../models/Case";
import Certificate from "../../models/Certificate";
import UserBadge from "../../models/UserBadge";
import { checkAndAwardAutoBadges } from "../badgeController";

jest.mock("../../models/User");
jest.mock("../../models/Case");
jest.mock("../../models/Certificate");
jest.mock("../../models/UserBadge");
jest.mock("../badgeController");

const mockedUser = User as unknown as jest.Mocked<typeof User>;
const mockedCase = Case as unknown as jest.Mocked<typeof Case>;
const mockedCertificate = Certificate as unknown as jest.Mocked<typeof Certificate>;
const mockedCheckAndAwardAutoBadges = checkAndAwardAutoBadges as jest.Mock;

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("User Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLeaderboard", () => {
    it("sorts by points when an invalid metric is provided", async () => {
      const req = { query: { userType: "intern", metric: "invalidMetric", limit: "10" } } as unknown as Request;
      const res = mockResponse();

      const limitMock = jest.fn().mockResolvedValue([]);
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ sort: sortMock });
      mockedUser.find.mockReturnValue({ select: selectMock } as any);

      await getLeaderboard(req, res);

      expect(sortMock).toHaveBeenCalledWith({ points: -1 });
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metric: "points" }),
        })
      );
    });

    it("clamps limitNum correctly when exceeding 100 or below 1", async () => {
      const res1 = mockResponse();
      const req1 = { query: { limit: "200" } } as unknown as Request;
      
      const limitMock = jest.fn().mockResolvedValue([]);
      mockedUser.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({ limit: limitMock }),
        }),
      } as any);

      await getLeaderboard(req1, res1);
      expect(limitMock).toHaveBeenCalledWith(100);

      const res2 = mockResponse();
      const req2 = { query: { limit: "-5" } } as unknown as Request;
      await getLeaderboard(req2, res2);
      expect(limitMock).toHaveBeenCalledWith(1);
    });

    it("handles doctor mentorScore sorting correctly", async () => {
      const req = { query: { userType: "doctor", metric: "mentorScore" } } as unknown as Request;
      const res = mockResponse();

      const doc1Id = new mongoose.Types.ObjectId().toHexString();
      const doc2Id = new mongoose.Types.ObjectId().toHexString();

      const doctor1 = {
        _id: doc1Id,
        firstName: "Alice",
        lastName: "Smith",
        averageRating: 4.5,
        mentoringCredits: 10,
        toObject: () => ({ _id: doc1Id, firstName: "Alice" })
      };
      
      const doctor2 = {
        _id: doc2Id,
        firstName: "Bob",
        lastName: "Jones",
        averageRating: 5.0,
        mentoringCredits: 20,
        toObject: () => ({ _id: doc2Id, firstName: "Bob" })
      };

      mockedUser.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([doctor1, doctor2])
      } as any);

      // Mock aggregate/count operations for calculateMentorStats
      mockedCase.countDocuments.mockResolvedValue(2);
      mockedUser.countDocuments.mockResolvedValue(1);
      mockedCertificate.aggregate.mockResolvedValue([{ certificatesIssued: 3, casesReviewed: 5 }]);
      mockedCase.aggregate.mockResolvedValue([{ discussionCount: 10, likesReceived: 20, followUpsPosted: 2 }]);

      await getLeaderboard(req, res);

      expect(res.json).toHaveBeenCalled();
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.metric).toBe("mentorScore");
      
      // Since doctor2 has higher averageRating and mentoringCredits, they should score higher.
      // We also check if rank is assigned correctly.
      expect(responseData.data.leaderboard.length).toBe(2);
      expect(responseData.data.leaderboard[0].rank).toBe(1);
      expect(responseData.data.leaderboard[1].rank).toBe(2);
    });
  });

  describe("getDoctorMentorSummary", () => {
    it("verifies the output shape of calculateMentorStats", async () => {
      const docId = new mongoose.Types.ObjectId().toHexString();
      const req = { params: { userId: docId } } as unknown as Request;
      const res = mockResponse();

      const doctor = {
        _id: docId,
        firstName: "Alice",
        lastName: "Smith",
        specialization: "Cardiology",
        isVerifiedDoctor: true,
        averageRating: 4.5,
        mentoringCredits: 50,
      };

      mockedUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(doctor)
      } as any);

      mockedCase.countDocuments.mockResolvedValue(5);
      mockedUser.countDocuments.mockResolvedValue(3);
      mockedCertificate.aggregate.mockResolvedValue([{ certificatesIssued: 2, casesReviewed: 10 }]);
      mockedCase.aggregate.mockResolvedValue([{ discussionCount: 15, likesReceived: 25, followUpsPosted: 4 }]);

      await getDoctorMentorSummary(req, res);

      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.success).toBe(true);
      
      const stats = responseData.data.mentorStats;
      // Check interface MentorStats
      expect(stats).toHaveProperty("mentorScore");
      expect(stats).toHaveProperty("casesPosted", 5);
      expect(stats).toHaveProperty("internsMentored", 3);
      expect(stats).toHaveProperty("certificatesIssued", 2);
      expect(stats).toHaveProperty("casesReviewed", 10);
      expect(stats).toHaveProperty("discussionCount", 15);
      expect(stats).toHaveProperty("likesReceived", 25);
      expect(stats).toHaveProperty("followUpsPosted", 4);
      expect(stats).toHaveProperty("averageRating", 4.5);
      expect(stats).toHaveProperty("mentoringCredits", 50);
      
      expect(stats).toHaveProperty("scoreBreakdown");
      expect(stats.scoreBreakdown).toHaveProperty("casesPosted");
      expect(stats.scoreBreakdown).toHaveProperty("internsMentored");
      expect(stats.scoreBreakdown).toHaveProperty("ratingQuality");

      expect(stats).toHaveProperty("resumeSummary");
      expect(typeof stats.resumeSummary).toBe("string");
      expect(stats.resumeSummary).toContain("Alice Smith");
      expect(stats.resumeSummary).toContain("Cardiology");
      expect(stats.resumeSummary).toContain("verified doctor");
    });

    it("returns 404 if doctor not found", async () => {
      const req = { params: { userId: "doc-1" } } as unknown as Request;
      const res = mockResponse();

      mockedUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      } as any);

      await getDoctorMentorSummary(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateUserStreak", () => {
    it("resets streak to 0 if no activity today", async () => {
      mockedCase.findOne.mockResolvedValue(null);
      
      await updateUserStreak("user-1");

      expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith("user-1", { $set: { streak: 0 } });
    });

    it("does not increment streak if already incremented today", async () => {
      mockedCase.findOne.mockResolvedValue({ _id: "activity-1" });
      
      const user = {
        streak: 5,
        lastActivityDate: new Date() // today
      };
      
      mockedUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
      } as any);

      await updateUserStreak("user-1");

      expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith("user-1", {
        $set: expect.objectContaining({ lastActivityDate: expect.any(Date) })
      });
      // We check that it didn't call $inc
      const updatePayload = (mockedUser.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
      expect(updatePayload).not.toHaveProperty("$inc");
    });

    it("increments streak if active yesterday", async () => {
      mockedCase.findOne.mockResolvedValue({ _id: "activity-1" });
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const user = {
        streak: 5,
        lastActivityDate: yesterday
      };
      
      mockedUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
      } as any);

      await updateUserStreak("user-1");

      expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith("user-1", expect.objectContaining({
        $inc: { streak: 1 },
        $max: { longestStreak: 6 },
        $set: expect.objectContaining({ lastActivityDate: expect.any(Date) })
      }));
      expect(mockedCheckAndAwardAutoBadges).toHaveBeenCalledWith("user-1");
    });

    it("starts new streak if last active before yesterday", async () => {
      mockedCase.findOne.mockResolvedValue({ _id: "activity-1" });
      
      const lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 30);

      const user = {
        streak: 5,
        lastActivityDate: lastMonth
      };
      
      mockedUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
      } as any);

      await updateUserStreak("user-1");

      expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith("user-1", expect.objectContaining({
        $set: expect.objectContaining({ streak: 1, lastActivityDate: expect.any(Date) }),
        $max: { longestStreak: 1 }
      }));
      expect(mockedCheckAndAwardAutoBadges).toHaveBeenCalledWith("user-1");
    });
  });
});
