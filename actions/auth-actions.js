"use server";

import { createUser } from "@/lib/user";
import { hashUserPassword } from "@/lib/hash";
import { redirect } from "next/navigation";

export async function signup(_prevState, formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  let errors = {};

  if (!email.includes("@")) {
    errors.email = "Please enter a valid email";
  }

  if (password.trim().length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (Object.keys(errors).length) {
    return { errors };
  }

  const hashedPassword = hashUserPassword(password);

  try {
    createUser(email, hashedPassword);
  } catch (e) {
    if (e.code === "SQLITE_CONSTANT_UNIQUE") {
      return {
        errors: {
          email:
            "The email address is already in use. Please try a different one.",
        },
      };
    }
    throw e;
  }

  redirect("/training");
}
