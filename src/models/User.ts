import { timeStamp } from "console";
import mongoose from "mongoose";
import validator from "validator";

interface IUser extends Document {
  name: string;
  email: string;
  photo: string;
  role: "user" | "admin";
  gender: "male" | "female";
  dob: Date;

  //  timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual Attribute
  age: number;
}

const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: [true, "Please Enter ID"],
    },
    name: {
      type: String,
      required: [true, "Please Enter Name"],
    },
    email: {
      type: String,
      unique: [true, "Email alredy exist"],
      required: [true, "Please Enter Email"],
      validate: validator.default.isEmail,
    },
    photo: {
      type: String,
      required: [true, "Please Add photo"],
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "user",
      required: [true, "Please Enter Gender"],
    },
    dob: {
      type: Date,
      required: [true, "Please Enter Date of Birth"],
    },
  },
  { timestamps: true }
);

UserSchema.virtual("age").get(function () {
  const today = new Date();
  const dob = this.dob;

  let age = today.getFullYear() - dob.getFullYear();

  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
});
const User = mongoose.model<IUser>("User", UserSchema);
export default User;
