import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createDemoGateway } from "./demoGateway.js";
import { createOracleGateway } from "./oracleGateway.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const useMockDb = process.env.USE_MOCK_DB === "true" || !process.env.ORACLE_USER;
const db = useMockDb ? createDemoGateway() : await createOracleGateway();

app.use(cors());
app.use(express.json());

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.get("/health", (_req, res) => {
  res.json({ success: true, mode: useMockDb ? "demo" : "oracle-plsql" });
});

app.post("/register", asyncRoute(async (req, res) => {
  const userId = await db.registerUser(req.body);
  res.json({
    success: true,
    message: "Registration done. Admin approval is needed before trading.",
    user_id: userId
  });
}));

app.post("/login", asyncRoute(async (req, res) => {
  const user = await db.loginUser(req.body.email, req.body.password);
  if (!user) {
    res.status(401).json({ success: false, message: "Invalid login details." });
    return;
  }
  res.json({ success: true, user });
}));

app.get("/listings", asyncRoute(async (_req, res) => {
  res.json({ success: true, listings: await db.listListings() });
}));

app.post("/sell-energy", asyncRoute(async (req, res) => {
  const listingId = await db.sellEnergy(req.body);
  res.json({ success: true, message: "Listing added.", listing_id: listingId });
}));

app.post("/buy-energy", asyncRoute(async (req, res) => {
  const transactionId = await db.buyEnergy(req.body);
  res.json({ success: true, message: "Energy purchased.", transaction_id: transactionId });
}));

app.post("/meter-reading", asyncRoute(async (req, res) => {
  await db.addMeterReading(req.body);
  res.json({ success: true, message: "Meter reading saved." });
}));

app.get("/wallet/:userId", asyncRoute(async (req, res) => {
  res.json({ success: true, wallet: await db.wallet(Number(req.params.userId)) });
}));

app.get("/transactions/:userId", asyncRoute(async (req, res) => {
  res.json({ success: true, transactions: await db.transactions(Number(req.params.userId)) });
}));

app.get("/admin/pending-users", asyncRoute(async (_req, res) => {
  res.json({ success: true, users: await db.pendingUsers() });
}));

app.post("/admin/approve-user", asyncRoute(async (req, res) => {
  await db.approveUser(req.body);
  res.json({ success: true, message: "User status updated." });
}));

app.get("/admin/logs", asyncRoute(async (_req, res) => {
  res.json({ success: true, logs: await db.adminLogs() });
}));

app.use((err, _req, res, _next) => {
  res.status(400).json({
    success: false,
    message: err.message?.replace(/^ORA-\d+:\s*/i, "") || "Something went wrong."
  });
});

app.listen(port, () => {
  console.log(`Energy P2P API running on http://127.0.0.1:${port}`);
});
