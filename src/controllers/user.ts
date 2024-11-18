import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utils-classes.js";
import { tryCatch } from "../middlewares/Error.js";

export const newUser = tryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, gender, dob, _id } = req.body;

    let user = await User.findById({ _id });

    if (user) {
      return res.status(201).json({
        success: true,
        message: `Welcome ${user.name}`,
      });
    }
    if (!name || !email || !photo || !gender || !dob || !_id) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill in all" });
    }

    user = await User.create({
      name,
      email,
      photo,
      gender,
      dob: new Date(dob),
      _id,
    });

    return res.status(201).json({
      success: true,
      message: `Welcome ${user.name}`,
    });
  }
);

export const getAllUsers = tryCatch(async (req, res, next) => {
  const users = await User.find({});

  if (!users) {
    return next(new ErrorHandler("Users not found", 404));
  }
  return res.status(200).json({
    success: true,
    users,
  });
});

export const getUser = tryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) {
    return next(new ErrorHandler("Invalid ID", 404));
  }

  return res.status(200).json({
    success: true,
    user,
  });
});
export const deleteUser = tryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) {
    return next(new ErrorHandler("USer Not found", 404));
  }

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
