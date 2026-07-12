import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscussionComment {
  _id?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  replies: mongoose.Types.ObjectId[];
  replyTo?: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IResearchPaper extends Document {
  title: string;
  description: string;
  field: string;
  difficulty: string;
  fileUrl: string;
  comments: IDiscussionComment[];
  createdAt: Date;
}

const DiscussionCommentSchema = new Schema<IDiscussionComment>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [2000, 'Comment cannot be more than 2000 characters'],
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'DiscussionComment',
  }],
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'DiscussionComment',
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

const ResearchPaperSchema = new Schema<IResearchPaper>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  field: { type: String, required: true },
  difficulty: { type: String, required: true },
  fileUrl: { type: String, required: true },
  comments: [DiscussionCommentSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IResearchPaper>('ResearchPaper', ResearchPaperSchema);
