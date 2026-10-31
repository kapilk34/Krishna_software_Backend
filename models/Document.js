import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    type: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    collection: {
      type: String,
      required: true,
      enum: [
        "Documents",
        "Books & Journals",
        "PDF & Office Files",
        "Images & Photographs",
        "Audio & Video",
        "Archives & Manuscripts",
        "Scanned Documents",
      ],
    },
    description: { type: String, default: "", maxlength: 5000 },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    permission: { type: String, enum: ["view", "edit"], required: true },
    accessEmails: {
      type: [{ type: String, trim: true, lowercase: true }],
      default: [],
    },
    file: {
      data: { type: Buffer, required: true, select: false },
      name: { type: String, required: true, maxlength: 255 },
      contentType: { type: String, required: true, maxlength: 150 },
      size: { type: Number, required: true, min: 1 },
    },
  },
  { timestamps: true },
);

documentSchema.index({ owner: 1, createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
