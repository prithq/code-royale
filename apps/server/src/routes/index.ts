import { Router } from "express";
import matchRouter from "./match.route";

const router:Router = Router();
router.use("/match", matchRouter);

export default router;