import User from "../models/User.js";
import { tryCatch } from "./Error.js";

export const adminOnly = tryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Please Log IN" });
  }

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ message: "Invalid User" });
  }
  if (user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "You are not authorized to access this resource" });
  }
  next();
});
