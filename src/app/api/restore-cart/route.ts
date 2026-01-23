import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cartId = searchParams.get("cart_id");

  if (cartId) {
    const cookieStore = await cookies();
    const existingCartId = cookieStore.get("cart-id")?.value;

    // Only set if user doesn't already have a cart
    if (!existingCartId) {
      cookieStore.set("cart-id", cartId, {
        maxAge: 60 * 60 * 24 * 10, // 10 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  redirect("/cart");
}
