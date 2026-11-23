import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { authorized: false },
        { status: 401 }
      );
    }

    const idToken = authorization.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const isSuperAdmin =
      !!process.env.SUPER_ADMIN_UID &&
      decodedToken.uid === process.env.SUPER_ADMIN_UID;

    return NextResponse.json({
      authorized: isSuperAdmin,
    });
  } catch {
    return NextResponse.json(
      { authorized: false },
      { status: 401 }
    );
  }
}