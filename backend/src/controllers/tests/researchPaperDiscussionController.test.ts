import { Response } from "express";
import {
  addComment,
  replyToComment,
  likeComment,
  deleteComment,
  getComments,
} from "../researchPaperDiscussionController";
import { AuthRequest } from "../../middleware/auth";
import ResearchPaper from "../../models/ResearchPaper";

jest.mock("../../utils/asyncHandler", () => ({
  asyncHandler: (fn: any) => fn,
}));

jest.mock("../../models/ResearchPaper");

const mockedResearchPaper = ResearchPaper as jest.Mocked<typeof ResearchPaper>;

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockRequest = (
  userId: string,
  params: Record<string, string> = {},
  body: Record<string, any> = {},
  query: Record<string, any> = {},
): AuthRequest =>
  ({
    params,
    body,
    query,
    user: { _id: userId },
  }) as unknown as AuthRequest;

describe("ResearchPaperDiscussionController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addComment", () => {
    it("creates a comment on a research paper", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const paperMock = {
        _id: "paper-1",
        comments: [],
        save,
      };
      mockedResearchPaper.findById.mockResolvedValue(paperMock as any);

      const req = mockRequest("user-1", { id: "paper-1" }, { content: "Great paper!" });
      const res = mockResponse();
      const next = jest.fn();

      await addComment(req as any, res as any, next);

      expect(paperMock.comments).toHaveLength(1);
      expect(paperMock.comments[0]).toMatchObject({
        content: "Great paper!",
        author: "user-1",
      });
      expect(save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 if content is empty", async () => {
      const req = mockRequest("user-1", { id: "paper-1" }, { content: "" });
      const res = mockResponse();
      const next = jest.fn();

      await expect(addComment(req as any, res as any, next)).rejects.toThrow("Comment content is required");
    });

    it("returns 401 if user is not authenticated", async () => {
      const req = mockRequest("", { id: "paper-1" }, { content: "Nice" });
      delete (req as any).user;

      const res = mockResponse();
      const next = jest.fn();

      await expect(addComment(req as any, res as any, next)).rejects.toThrow("User not authenticated");
    });

    it("returns 404 if paper not found", async () => {
      mockedResearchPaper.findById.mockResolvedValue(null);

      const req = mockRequest("user-1", { id: "nonexistent" }, { content: "Nice" });
      const res = mockResponse();
      const next = jest.fn();

      await expect(addComment(req as any, res as any, next)).rejects.toThrow("Research paper not found");
    });
  });

  describe("replyToComment", () => {
    it("adds a reply to an existing comment", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const parentComment = {
        _id: "comment-1",
        author: "user-2",
        content: "Great question",
        replies: [],
        likes: [],
      };
      const paperMock = {
        _id: "paper-1",
        comments: [parentComment],
        save,
      };
      mockedResearchPaper.findById.mockResolvedValue(paperMock as any);

      const req = mockRequest(
        "user-1",
        { paperId: "paper-1", commentId: "comment-1" },
        { content: "Thanks!" },
      );
      const res = mockResponse();
      const next = jest.fn();

      await replyToComment(req as any, res as any, next);

      expect(paperMock.comments).toHaveLength(2);
      expect(paperMock.comments[1]).toMatchObject({
        content: "Thanks!",
        replyTo: "comment-1",
      });
      expect(parentComment.replies).toHaveLength(1);
      expect(save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 404 if parent comment not found", async () => {
      const paperMock = {
        _id: "paper-1",
        comments: [{ _id: "comment-1", content: "Hello" }],
      };
      mockedResearchPaper.findById.mockResolvedValue(paperMock as any);

      const req = mockRequest(
        "user-1",
        { paperId: "paper-1", commentId: "nonexistent" },
        { content: "Reply" },
      );
      const res = mockResponse();
      const next = jest.fn();

      await expect(replyToComment(req as any, res as any, next)).rejects.toThrow("Comment not found");
    });
  });

  describe("likeComment", () => {
    const VALID_USER_ID = "507f1f77bcf86cd799439011";
    const VALID_COMMENT_ID = "507f1f77bcf86cd799439012";

    it("toggles like on a comment (unlike when already liked)", async () => {
      mockedResearchPaper.updateOne
        .mockResolvedValueOnce({ modifiedCount: 1 } as any);
      mockedResearchPaper.findById.mockResolvedValue({
        comments: [{ likes: [] }],
      } as any);

      const req = mockRequest(VALID_USER_ID, { paperId: "paper-1", commentId: VALID_COMMENT_ID });
      const res = mockResponse();
      const next = jest.fn();

      await likeComment(req as any, res as any, next);

      expect(mockedResearchPaper.updateOne).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ liked: false }),
        }),
      );
    });

    it("toggles like on a comment (like when not liked)", async () => {
      mockedResearchPaper.updateOne
        .mockResolvedValueOnce({ modifiedCount: 0 } as any)
        .mockResolvedValueOnce({ modifiedCount: 1 } as any);
      mockedResearchPaper.findById.mockResolvedValue({
        comments: [{ likes: [VALID_USER_ID] }],
      } as any);

      const req = mockRequest(VALID_USER_ID, { paperId: "paper-1", commentId: VALID_COMMENT_ID });
      const res = mockResponse();
      const next = jest.fn();

      await likeComment(req as any, res as any, next);

      expect(mockedResearchPaper.updateOne).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ liked: true, likes: 1 }),
        }),
      );
    });
  });

  describe("deleteComment", () => {
    it("deletes own comment successfully", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const paperMock = {
        _id: "paper-1",
        comments: [
          { _id: "comment-1", author: { toString: () => "user-1" }, content: "My comment" },
        ],
        save,
      };
      mockedResearchPaper.findById.mockResolvedValue(paperMock as any);

      const req = mockRequest("user-1", { paperId: "paper-1", commentId: "comment-1" });
      const res = mockResponse();
      const next = jest.fn();

      await deleteComment(req as any, res as any, next);

      expect(paperMock.comments).toHaveLength(0);
      expect(save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("returns 403 when deleting another user's comment", async () => {
      const paperMock = {
        _id: "paper-1",
        comments: [
          { _id: "comment-1", author: { toString: () => "user-2" }, content: "Their comment" },
        ],
      };
      mockedResearchPaper.findById.mockResolvedValue(paperMock as any);

      const req = mockRequest("user-1", { paperId: "paper-1", commentId: "comment-1" });
      const res = mockResponse();
      const next = jest.fn();

      await expect(deleteComment(req as any, res as any, next)).rejects.toThrow(
        "You can only delete your own comments",
      );
    });
  });

  describe("getComments", () => {
    it("returns paginated comments", async () => {
      const comments = Array.from({ length: 25 }, (_, i) => ({
        _id: `comment-${i}`,
        content: `Comment ${i}`,
        author: "user-1",
      }));
      const populateMock = jest.fn().mockResolvedValue({
        _id: "paper-1",
        comments,
      });
      mockedResearchPaper.findById.mockReturnValue({
        populate: populateMock,
      } as any);

      const req = mockRequest("user-1", { id: "paper-1" }, {}, { page: "1", limit: "10" });
      const res = mockResponse();
      const next = jest.fn();

      await getComments(req as any, res as any, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comments: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: 25,
              pages: 3,
            }),
          }),
        }),
      );
    });

    it("returns 404 if paper not found", async () => {
      const populateMock = jest.fn().mockResolvedValue(null);
      mockedResearchPaper.findById.mockReturnValue({
        populate: populateMock,
      } as any);

      const req = mockRequest("user-1", { id: "nonexistent" });
      const res = mockResponse();
      const next = jest.fn();

      await expect(getComments(req as any, res as any, next)).rejects.toThrow(
        "Research paper not found",
      );
    });
  });
});
