// controller.ts

import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import client from "../../utils/client.ts";

const router = express.Router();
const clerkAuth = ClerkExpressRequireAuth();

router.get("/users", clerkAuth, async (req, res) => {
  try {
    const user = await client.user.findUnique({
      where: { clerkId: req.auth.userId },
    });
    res.json(user);
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", clerkAuth, async (req, res) => {
  try {
    const user = await client.user.upsert({
      where: { clerkId: req.auth.userId },
      update: {
        email: req.body.email,
        name: req.body.name,
      },
      create: {
        clerkId: req.auth.userId,
        email: req.body.email,
        name: req.body.name,
      },
    });
    res.json(user);
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users", clerkAuth, async (req, res) => {
  try {
    const user = await client.user.update({
      where: { clerkId: req.auth.userId },
      data: {
        email: req.body.email,
        name: req.body.name,
      },
    });
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;