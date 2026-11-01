import { Router } from "express";
import {
  createDocument,
  deleteDocument,
  downloadDocumentFile,
  listDocuments,
} from "../controllers/documentController.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", listDocuments);
router.post("/", createDocument);
router.delete("/:id", deleteDocument);
router.get("/:id/file", downloadDocumentFile);

export default router;
