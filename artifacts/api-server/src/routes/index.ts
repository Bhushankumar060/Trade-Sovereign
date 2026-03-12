import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import mediaRouter from "./media.js";
import ordersRouter from "./orders.js";
import paymentsRouter from "./payments.js";
import subscriptionsRouter from "./subscriptions.js";
import rewardsRouter from "./rewards.js";
import aiRouter from "./ai.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/media", mediaRouter);
router.use("/orders", ordersRouter);
router.use("/payments", paymentsRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/rewards", rewardsRouter);
router.use("/ai", aiRouter);
router.use("/admin", adminRouter);

export default router;
