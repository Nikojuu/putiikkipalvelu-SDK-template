"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { STORE_NAME } from "@/app/utils/constants";
import { storefront } from "@/lib/storefront";
import {
  ValidationError,
  VerificationRequiredError,
} from "@putiikkipalvelu/storefront-sdk";
import type {
  Customer,
  CustomerWithVerification,
} from "@putiikkipalvelu/storefront-sdk";

// =============================================================================
// Validation Schemas
// =============================================================================

const RegisterSchema = z.object({
  firstName: z.string().min(1, "Etunimi on pakollinen"),
  lastName: z.string().min(1, "Sukunimi on pakollinen"),
  email: z.string().email("Virheellinen sähköpostiosoite"),
  password: z.string().min(8, "Salasanan on oltava vähintään 8 merkkiä pitkä"),
});

const LoginSchema = z.object({
  email: z.string().email("Virheellinen sähköpostiosoite"),
  password: z.string().min(1, "Salasana on pakollinen"),
});

const EditProfileSchema = z.object({
  firstName: z.string().min(1, "Etunimi on pakollinen"),
  lastName: z.string().min(1, "Sukunimi on pakollinen"),
  email: z.string().email("Virheellinen sähköpostiosoite"),
});

// =============================================================================
// Helper Functions
// =============================================================================

async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("session-id")?.value;
}

async function setSessionCookie(sessionId: string, expiresAt: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "session-id",
    value: sessionId,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
  });
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session-id");
}

async function setCartIdCookie(cartId: string) {
  const cookieStore = await cookies();
  cookieStore.set("cart-id", cartId, {
    maxAge: 60 * 60 * 24 * 10, // 10 days
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

async function clearCartIdCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("cart-id");
}

async function getGuestCartId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("cart-id")?.value;
}

// =============================================================================
// Email Functions (Store-specific, not in SDK)
// =============================================================================

async function sendVerificationEmail(customer: CustomerWithVerification) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${customer.emailVerificationToken}`;

    const { error } = await resend.emails.send({
      from: `${STORE_NAME} <info@putiikkipalvelu.fi>`,
      to: customer.email,
      subject: `Vahvista sähköpostisi – ${STORE_NAME}`,
      text: `Tervetuloa ${customer.firstName}! Vahvista sähköpostiosoitteesi vierailemalla: ${verificationUrl}`,
      html: `
        <h2>Tervetuloa ${customer.firstName}!</h2>
        <p>Napsauta alla olevaa linkkiä vahvistaaksesi sähköpostisi:</p>
        <a href="${verificationUrl}">Vahvista sähköposti</a>
        <p>Tämä linkki vanhenee 24 tunnin kuluttua.</p>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// Auth Actions (Using SDK)
// =============================================================================

export async function registerCustomer(formData: FormData) {
  const validatedFields = RegisterSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email, password } = validatedFields.data;

  try {
    const response = await storefront.customer.register({
      firstName,
      lastName,
      email,
      password,
    });

    if (!response.success || !response.customer) {
      return { error: "Invalid response from server. Please try again." };
    }

    // Send verification email (store-specific, not in SDK)
    const emailResult = await sendVerificationEmail(
      response.customer as CustomerWithVerification
    );
    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      // Don't fail registration, just log the error
    }

    // Remove sensitive verification token from response
    const { emailVerificationToken, emailVerificationExpiresAt, ...customerData } =
      response.customer as CustomerWithVerification;

    return {
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      customer: customerData,
    };
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function loginCustomer(formData: FormData) {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  // Get guest cart-id from cookie (if user was guest before login)
  const guestCartId = await getGuestCartId();

  try {
    const response = await storefront.customer.login(email, password, {
      cartId: guestCartId,
    });

    if (!response.success || !response.customer || !response.sessionId || !response.expiresAt) {
      return { error: "Invalid response from server. Please try again." };
    }

    // Set session cookie
    await setSessionCookie(response.sessionId, response.expiresAt);

    // Delete guest cart-id cookie (backend already merged and deleted guest cart)
    await clearCartIdCookie();

    return {
      success: true,
      message: response.message || "Login successful!",
      customer: response.customer,
    };
  } catch (error) {
    console.error("Login error:", error);

    // Handle email verification required
    if (error instanceof VerificationRequiredError) {
      return {
        requiresVerification: true,
        customerId: error.customerId,
        error: "Vahvista sähköpostiosoitteesi ennen sisäänkirjautumista.",
      };
    }

    if (error instanceof ValidationError) {
      return { error: error.message };
    }

    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function getUser() {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return { user: null, error: "No active session found." };
  }

  try {
    const response = await storefront.customer.getUser(sessionId);

    if (!response.success || !response.customer) {
      return {
        user: null,
        error: "Invalid response from server.",
      };
    }

    return {
      success: true,
      user: response.customer,
    };
  } catch (error) {
    console.error("Get user error:", error);
    return {
      user: null,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function logout() {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return;
  }

  try {
    const response = await storefront.customer.logout(sessionId);

    // Clear session cookie
    await clearSessionCookie();

    // If cart was migrated, store the new guest cart ID
    if (response.cartId) {
      await setCartIdCookie(response.cartId);
    }

    return;
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear session on error
    await clearSessionCookie();
    return;
  }
}

// =============================================================================
// Profile Management Actions (Using SDK)
// =============================================================================

export async function editCustomerProfile(formData: FormData) {
  const validatedFields = EditProfileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email } = validatedFields.data;

  const sessionId = await getSessionId();
  if (!sessionId) {
    return { error: "No active session found. Please login again." };
  }

  try {
    const response = await storefront.customer.updateProfile(sessionId, {
      firstName,
      lastName,
      email,
    });

    return {
      success: true,
      message: response.message || "Profile updated successfully!",
      customer: response.customer,
    };
  } catch (error) {
    console.error("Edit profile error:", error);
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function deleteCustomerAccount() {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return { error: "No active session found." };
  }

  try {
    await storefront.customer.deleteAccount(sessionId);

    // Clear session cookie since account is deleted
    await clearSessionCookie();

    return {
      success: true,
      message: "Account deleted successfully!",
    };
  } catch (error) {
    console.error("Delete account error:", error);
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred. Please try again." };
  }
}

// =============================================================================
// Email Verification Actions (Using SDK)
// =============================================================================

export async function resendVerificationEmail(customerId: string) {
  try {
    const response = await storefront.customer.resendVerification(customerId);

    // Send the verification email using store-specific logic
    if (response.success && response.customer) {
      const emailResult = await sendVerificationEmail(
        response.customer as CustomerWithVerification
      );
      if (!emailResult.success) {
        return { error: "Failed to send verification email" };
      }
    }

    return { success: true, message: "Verification email sent!" };
  } catch (error) {
    console.error("Email verification error:", error);
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred. Please try again." };
  }
}

// =============================================================================
// Wishlist Actions (Using SDK)
// =============================================================================

export async function addToWishlist(
  productId: string,
  returnUrl: string,
  variationId?: string
) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    // If not logged in, return a flag for the UI to handle redirect
    return { requiresLogin: true, returnUrl: returnUrl || null };
  }

  try {
    await storefront.customer.wishlist.add(sessionId, productId, variationId);
    return { success: true, message: "Added to wishlist" };
  } catch (error) {
    console.error("Add to wishlist error:", error);

    // Check if session expired
    if (error instanceof Error && error.message.includes("401")) {
      return { requiresLogin: true, returnUrl: returnUrl || null };
    }

    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function deleteWishlistItem(
  productId: string,
  variationId?: string | null
) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return { error: "No active session found." };
  }

  try {
    await storefront.customer.wishlist.remove(
      sessionId,
      productId,
      variationId || undefined
    );
    return { success: true, message: "Deleted from wishlist" };
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred. Please try again." };
  }
}

// Re-export types for backwards compatibility
export type { Customer, CustomerWithVerification };
