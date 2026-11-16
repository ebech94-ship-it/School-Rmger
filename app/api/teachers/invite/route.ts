
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const idToken = authorization.substring(7);
    const decoded = await adminAuth.verifyIdToken(idToken);

    const adminRef = adminDb.collection("users").doc(decoded.uid);
    const adminSnapshot = await adminRef.get();

    if (!adminSnapshot.exists) {
      return NextResponse.json(
        { error: "Administrator profile not found." },
        { status: 403 }
      );
    }

    const adminProfile = adminSnapshot.data();

    if (
      adminProfile?.role !== "technical_admin" ||
      adminProfile?.active !== true ||
      !adminProfile?.schoolId
    ) {
      return NextResponse.json(
        { error: "You are not authorised to invite teachers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const teacherId = String(body.teacherId || "").trim();

    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID is required." },
        { status: 400 }
      );
    }

    const schoolId = adminProfile.schoolId;

    const teacherRef = adminDb
      .collection("schools")
      .doc(schoolId)
      .collection("teachers")
      .doc(teacherId);

    const teacherSnapshot = await teacherRef.get();

    if (!teacherSnapshot.exists) {
      return NextResponse.json(
        { error: "Teacher record not found." },
        { status: 404 }
      );
    }

    const teacher = teacherSnapshot.data();

    if (teacher?.status !== "active") {
      return NextResponse.json(
        { error: "Only active teachers can receive invitations." },
        { status: 400 }
      );
    }

    if (teacher?.accountStatus === "active" || teacher?.authUid) {
      return NextResponse.json(
        { error: "This teacher already has an account." },
        { status: 409 }
      );
    }

    if (!teacher?.email || typeof teacher.email !== "string") {
      return NextResponse.json(
        { error: "This teacher has no valid email address." },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const invitationCollection = adminDb.collection("teacherInvitations");

    // Revoke earlier unused invitations for this teacher.
    const previousInvitations = await invitationCollection
      .where("schoolId", "==", schoolId)
      .where("teacherId", "==", teacherId)
      .where("status", "==", "pending")
      .get();

    const batch = adminDb.batch();

    previousInvitations.docs.forEach((invitation) => {
      batch.update(invitation.ref, {
        status: "revoked",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + 48 * 60 * 60 * 1000)
    );

    const invitationRef = invitationCollection.doc(tokenHash);

    batch.set(invitationRef, {
      schoolId,
      teacherId,
      email: teacher.email.trim().toLowerCase(),
      status: "pending",
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: decoded.uid,
    });

    await batch.commit();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin");

    if (!appUrl) {
      return NextResponse.json(
        { error: "Application URL is not configured." },
        { status: 500 }
      );
    }

    const invitationUrl = new URL("/accept-invitation", appUrl);
    invitationUrl.searchParams.set("token", token);

    return NextResponse.json({
      success: true,
      invitationUrl: invitationUrl.toString(),
      email: teacher.email,
      expiresInHours: 48,
    });
  } catch (error) {
    console.error("Teacher invitation error:", error);

    return NextResponse.json(
      { error: "Unable to generate invitation. Please try again." },
      { status: 500 }
    );
  }
}
