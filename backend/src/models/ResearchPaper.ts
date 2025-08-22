import mongoose, { Document, Schema } from 'mongoose';

export interface IResearchPaper extends Document {
  title: string;
  description: string;
  field: string;
  difficulty: string;
  fileUrl: string;
  createdAt: Date;
}

const ResearchPaperSchema = new Schema<IResearchPaper>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  field: { type: String, required: true },
  difficulty: { type: String, required: true },
  fileUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IResearchPaper>('ResearchPaper', ResearchPaperSchema);
