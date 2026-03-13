import { Router } from "express";

const router = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/healthz/detailed", (_req, res) => {
  res.json({ status: "ok", message: "Server is running!" });
});

export default router;
