import { Router } from "express";
import {
  createDocument,
  downloadDocumentFile,
  listDocuments,
} from "../controllers/documentController.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", listDocuments);
router.post("/", createDocument);
router.get("/:id/file", downloadDocumentFile);

export default router;
