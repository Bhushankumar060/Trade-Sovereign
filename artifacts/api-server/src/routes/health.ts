import { Router, type IRouter, type Request, type Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/detailed", (_req, res) => {
  res.json({ status: "ok", message: "Server is running!" });
});

// The simple door Vercel usually looks for
router.get("/", (req, res) => {
  res.send("Trade Sovereign Server is Awesome and Running!");
});

// Another common door
router.get("/health", (req, res) => {
  res.send("OK");
});

export default router;