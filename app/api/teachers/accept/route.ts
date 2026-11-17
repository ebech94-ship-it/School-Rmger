
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  FieldValue,
  type DocumentReference,
  type DocumentData,
} from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
let invitationRef: DocumentReference | null = null;
  let createdUid: string | null = null;

  try {
    const body = await request.json();

    const token = String(body.token || "").trim();
    const password = String(body.password || "");

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: "Invalid invitation link." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    invitationRef = adminDb
      .collection("teacherInvitations")
      .doc(tokenHash);

   let invitation: DocumentData | undefined;

    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(invitationRef!);

      if (!snapshot.exists) {
        throw new Error("INVALID_INVITATION");
      }

      const data = snapshot.data();

      if (data?.status !== "pending") {
        throw new Error("INVITATION_ALREADY_USED");
      }

      if (!data.expiresAt || data.expiresAt.toMillis() <= Date.now()) {
        transaction.update(invitationRef!, {
          status: "expired",
          updatedAt: FieldValue.serverTimestamp(),
        });

        throw new Error("INVITATION_EXPIRED");
      }

      invitation = data;

      transaction.update(invitationRef!, {
        status: "processing",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    if (!invitation) {
      throw new Error("INVALID_INVITATION");
    }

    const schoolId = invitation.schoolId;
    const teacherId = invitation.teacherId;
    const email = String(invitation.email).trim().toLowerCase();

    const teacherRef = adminDb
      .collection("schools")
      .doc(schoolId)
      .collection("teachers")
      .doc(teacherId);

    const teacherSnapshot = await teacherRef.get();

    if (!teacherSnapshot.exists) {
      throw new Error("TEACHER_NOT_FOUND");
    }

    const teacher = teacherSnapshot.data();

    if (
      teacher?.status !== "active" ||
      String(teacher?.email || "").trim().toLowerCase() !== email ||
      teacher?.accountStatus === "active" ||
      teacher?.authUid
    ) {
      throw new Error("TEACHER_RECORD_NOT_ELIGIBLE");
    }

    const account = await adminAuth.createUser({
      email,
      password,
      displayName: teacher.name || email,
      emailVerified: false,
      disabled: false,
    });

    createdUid = account.uid;

    const batch = adminDb.batch();

    batch.set(adminDb.collection("users").doc(account.uid), {
      uid: account.uid,
      email,
      displayName: teacher.name || email,
      schoolId,
      role: "teacher",
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.update(teacherRef, {
      authUid: account.uid,
      accountStatus: "active",
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.update(invitationRef, {
      status: "accepted",
      acceptedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Your teacher account has been created. You can now sign in.",
    });
  } catch (error) {
  console.error("TEACHER ACTIVATION FAILURE:", error);
    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (cleanupError) {
        console.error("Account cleanup error:", cleanupError);
      }
    }

 if (invitationRef) {
  try {
    const currentInvitation = await invitationRef.get();

    if (currentInvitation.data()?.status === "processing") {
      await invitationRef.update({
        status: "pending",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch {
    // No further action if the invitation cannot be updated.
  }
}

    const message =
      error instanceof Error ? error.message : "";

    const messages: Record<string, string> = {
      INVALID_INVITATION: "This invitation link is invalid.",
      INVITATION_ALREADY_USED: "This invitation has already been used.",
      INVITATION_EXPIRED: "This invitation has expired. Ask your administrator for a new one.",
      TEACHER_NOT_FOUND: "The teacher record could not be found.",
      TEACHER_RECORD_NOT_ELIGIBLE: "This teacher record is no longer eligible for activation.",
      "auth/email-already-exists": "An account already exists for this email address. Contact your administrator.",
      "auth/invalid-password": "Please choose a stronger password.",
    };

    const status =
      message === "auth/email-already-exists" ? 409 :
      message.startsWith("INVITATION_") ? 400 :
      message === "INVALID_INVITATION" ? 400 :
      500;

    return NextResponse.json(
      {
        error:
          messages[message] ||
          "Account creation failed. Please ask your administrator for assistance.",
      },
      { status }
    );
  }
}
