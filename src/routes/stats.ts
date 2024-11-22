import express from "express";
import {
  getBarCharts,
  getDasboardStats,
  getLineCharts,
  getPieCharts,
} from "../controllers/statsController.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// /api/v1/dasboard/stats
app.get("/stats", adminOnly, getDasboardStats);

// /api/v1/dasboard/pies
app.get("/pies", adminOnly, getPieCharts);

// /api/v1/dasboard/bar
app.get("/bar", adminOnly, getBarCharts);

// /api/v1/dasboard/line
app.get("/line", adminOnly, getLineCharts);

export default app;
