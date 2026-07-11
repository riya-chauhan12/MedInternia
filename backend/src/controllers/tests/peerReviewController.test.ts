import { Response } from "express";
import mongoose from "mongoose";
import { submitPeerReview } from "../peerReviewController";
import PeerReview from "../../models/PeerReview";
import User from "../../models/User";
import Case from "../../models/Case";
import { createAndEmitNotification } from "../notificationController";
import { AuthRequest } from "../../middleware/auth";

jest.mock("../../models/PeerReview");
jest.mock("../../models/User");
jest.mock("../../models/Case");
jest.mock("../notificationController");

const mockedPeerReview = PeerReview as unknown as jest.Mocked<typeof PeerReview>;
const mockedUser = User as unknown as jest.Mocked<typeof User>;
const mockedCase = Case as unknown as jest.Mocked<typeof Case>;
const mockedNotification = createAndEmitNotification as jest.Mock;

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockRequest = (userId: string, userType: string, body: any = {}): AuthRequest => ({
  user: { _id: userId, userType },
  body,
}) as unknown as AuthRequest;

describe("Peer Review Controller", () => {
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession as any);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("submitPeerReview", () => {
    it("rejects review if reviewer is the reviewee", async () => {
      const req = mockRequest("intern-1", "intern", { revieweeId: "intern-1" });
      const res = mockResponse();

      await submitPeerReview(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Cannot review your own work" }));
    });

    it("rejects review if reviewer is not an intern or admin", async () => {
      const req = mockRequest("doc-1", "doctor", { revieweeId: "intern-2" });
      const res = mockResponse();

      await submitPeerReview(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Only interns or admins can submit") }));
    });

    it("rejects duplicate review for the same commentId", async () => {
      const req = mockRequest("intern-1", "intern", { revieweeId: "intern-2", caseId: "case-1", commentId: "comment-1" });
      const res = mockResponse();

      mockedCase.findById.mockResolvedValue({
        _id: "case-1",
        comments: [{ _id: "comment-1" }]
      } as any);

      mockedPeerReview.findOne.mockResolvedValue({ _id: "existing-review" } as any);

      await submitPeerReview(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "You have already reviewed this comment" }));
    });

    it("successfully creates review, calculates average rating, and sends notification", async () => {
      const req = mockRequest("intern-1", "intern", {
        revieweeId: "intern-2",
        caseId: "case-1",
        commentId: "comment-1",
        rating: 4,
      });
      const res = mockResponse();

      mockedCase.findById.mockResolvedValue({
        _id: "case-1",
        comments: [{ _id: "comment-1" }]
      } as any);

      mockedPeerReview.findOne.mockResolvedValue(null);

      const newReview = { _id: "review-1", rating: 4, populate: jest.fn().mockResolvedValue(true) };
      mockedPeerReview.create.mockResolvedValue([newReview] as any);

      // Mock the reviewee's existing reviews for the aggregation calculation
      // Current review (rating 4) + old review (rating 5) = average 4.5
      mockedPeerReview.find.mockReturnValue({
        session: jest.fn().mockResolvedValue([{ rating: 4 }, { rating: 5 }])
      } as any);

      await submitPeerReview(req as any, res as any);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockedPeerReview.create).toHaveBeenCalledWith([{
        reviewer: "intern-1",
        reviewee: "intern-2",
        caseId: "case-1",
        commentId: "comment-1",
        rating: 4,
        feedback: undefined,
        comments: undefined,
        tags: undefined
      }], { session: mockSession });

      expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith("intern-1", {
        $inc: { peerReviewsGiven: 1 }
      }, { session: mockSession });

      expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith("intern-2", {
        $inc: { peerReviewsReceived: 1 },
        $set: { averageRating: 4.5 }
      }, { session: mockSession });

      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(mockedNotification).toHaveBeenCalledWith(expect.objectContaining({
        recipientId: "intern-2",
        type: "peer_review"
      }));

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
