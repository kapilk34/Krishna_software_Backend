import mongoose from "mongoose";
import Document from "../models/Document.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const EMAIL_PATTERN = /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i;
const COLLECTIONS = new Set([
  "Documents",
  "Books & Journals",
  "PDF & Office Files",
  "Images & Photographs",
  "Audio & Video",
  "Archives & Manuscripts",
  "Scanned Documents",
]);

const documentResponse = (document) => ({
  id: String(document._id),
  title: document.title,
  type: document.type,
  category: document.category,
  collection: document.collection,
  description: document.description,
  details: document.details,
  permission: document.permission,
  accessEmails: document.accessEmails,
  fileName: document.file.name,
  fileContentType: document.file.contentType,
  fileSize: document.file.size,
  savedAt: document.createdAt,
});

export const createDocument = async (req, res) => {
  const { title, type, category, collection, description, details, permission, accessEmails, file } =
    req.body;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof type !== "string" ||
    !type.trim() ||
    typeof category !== "string" ||
    !category.trim() ||
    !COLLECTIONS.has(collection)
  ) {
    return res.status(400).json({ message: "Title, type, category, and a valid collection are required." });
  }

  if (typeof description !== "string" || description.length > 5000) {
    return res.status(400).json({ message: "Description must be 5,000 characters or fewer." });
  }

  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return res.status(400).json({ message: "Document details must be an object." });
  }

  if (!["view", "edit"].includes(permission)) {
    return res.status(400).json({ message: "Select a valid access permission." });
  }

  if (
    !Array.isArray(accessEmails) ||
    !accessEmails.length ||
    accessEmails.length > 100 ||
    accessEmails.some((email) => typeof email !== "string" || !EMAIL_PATTERN.test(email.trim()))
  ) {
    return res.status(400).json({ message: "Provide between 1 and 100 valid access email addresses." });
  }

  if (
    !file ||
    typeof file.name !== "string" ||
    !file.name.trim() ||
    typeof file.contentType !== "string" ||
    typeof file.data !== "string" ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(file.data)
  ) {
    return res.status(400).json({ message: "A valid document file is required." });
  }

  const fileBuffer = Buffer.from(file.data, "base64");
  if (
    !fileBuffer.length ||
    fileBuffer.length > MAX_FILE_SIZE ||
    (Number.isFinite(file.size) && file.size !== fileBuffer.length)
  ) {
    return res.status(400).json({ message: "File must be between 1 byte and 10 MB." });
  }

  try {
    const document = await Document.create({
      owner: req.user.id,
      title: title.trim(),
      type: type.trim(),
      category: category.trim(),
      collection,
      description: description.trim(),
      details,
      permission,
      accessEmails: [...new Set(accessEmails.map((email) => email.trim().toLowerCase()))],
      file: {
        data: fileBuffer,
        name: file.name.trim().slice(0, 255),
        contentType: file.contentType.trim().slice(0, 150) || "application/octet-stream",
        size: fileBuffer.length,
      },
    });

    return res.status(201).json({
      message: "Document uploaded successfully.",
      document: documentResponse(document),
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
};

export const listDocuments = async (req, res) => {
  const documents = await Document.find({ owner: req.user.id })
    .sort({ createdAt: -1 })
    .select("-file.data")
    .lean();

  return res.json({ documents: documents.map(documentResponse) });
};

export const downloadDocumentFile = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid document ID." });
  }

  const document = await Document.findOne({ _id: req.params.id, owner: req.user.id })
    .select("+file.data");
  if (!document) return res.status(404).json({ message: "Document not found." });

  const safeFileName = document.file.name.replace(/[\r\n"]/g, "_");
  const inlineTypes = new Set([
    "application/pdf",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "video/mp4",
    "video/ogg",
    "video/webm",
  ]);
  const disposition = inlineTypes.has(document.file.contentType) ? "inline" : "attachment";
  res.set({
    "Content-Type": document.file.contentType,
    "Content-Length": document.file.size,
    "Content-Disposition": `${disposition}; filename="download"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
    "X-Content-Type-Options": "nosniff",
  });
  return res.send(document.file.data);
};
