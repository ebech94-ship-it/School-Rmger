
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let createdUid: string | undefined;

  try {
    const body = await request.json();

    const token = String(body.token || "").trim();
    const password = String(body.password || "");

    if (!token || !password) {
      return NextResponse.json(
        { error: "Invitation token and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Your password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const invitationRef = adminDb
      .collection("schoolAdminInvitations")
      .doc(tokenHash);

    const invitationSnapshot = await invitationRef.get();

    if (!invitationSnapshot.exists) {
      return NextResponse.json(
        { error: "This invitation is invalid." },
        { status: 404 }
      );
    }

    const invitation = invitationSnapshot.data()!;

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation has already been used or revoked." },
        { status: 400 }
      );
    }

    if (
      !invitation.expiresAt ||
      invitation.expiresAt.toMillis() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "This invitation has expired. Contact your platform administrator." },
        { status: 400 }
      );
    }

    const schoolRef = adminDb
      .collection("schools")
      .doc(invitation.schoolId);

    const schoolSnapshot = await schoolRef.get();

    if (!schoolSnapshot.exists) {
      return NextResponse.json(
        { error: "The registered school could not be found." },
        { status: 404 }
      );
    }

    const email = String(invitation.email || "").trim().toLowerCase();
    const displayName = String(invitation.contactName || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "The invitation does not contain a valid email address." },
        { status: 400 }
      );
    }

    // Create the Technical Administrator's Firebase Auth account.
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      disabled: false,
      emailVerified: false,
    });

    createdUid = userRecord.uid;

    const userRef = adminDb
      .collection("users")
      .doc(createdUid);

    try {
      await adminDb.runTransaction(async (transaction) => {
        const currentInvitation = await transaction.get(invitationRef);
        const currentSchool = await transaction.get(schoolRef);
        const currentUser = await transaction.get(userRef);

        if (!currentInvitation.exists) {
          throw new Error("INVITATION_NOT_FOUND");
        }

        const currentData = currentInvitation.data()!;

        if (
          currentData.status !== "pending" ||
          !currentData.expiresAt ||
          currentData.expiresAt.toMillis() <= Date.now()
        ) {
          throw new Error("INVITATION_NO_LONGER_VALID");
        }

        if (!currentSchool.exists) {
          throw new Error("SCHOOL_NOT_FOUND");
        }

        if (currentUser.exists) {
          throw new Error("USER_PROFILE_ALREADY_EXISTS");
        }

        transaction.set(userRef, {
          uid: createdUid,
          email,
          displayName,
          schoolId: invitation.schoolId,
          role: "technical_admin",
          active: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        transaction.update(invitationRef, {
          status: "accepted",
          acceptedUid: createdUid,
          acceptedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (error) {
      // Remove the Auth account if Firestore activation fails.
      await adminAuth.deleteUser(createdUid);
      createdUid = undefined;
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Your Technical Administrator account has been activated.",
      email,
      schoolName: invitation.schoolName,
      schoolId: invitation.schoolId,
    });
  } catch (error) {
    console.error("School invitation acceptance error:", error);

    const errorCode = (error as { code?: string })?.code;

    if (errorCode === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "An account with this email already exists. Contact your platform administrator." },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "";

    if (message === "INVITATION_NO_LONGER_VALID") {
      return NextResponse.json(
        { error: "This invitation has already been used, revoked or expired." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to activate your account. Please try again or contact your platform administrator." },
      { status: 500 }
    );
  }
}
