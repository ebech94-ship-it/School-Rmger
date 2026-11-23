
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Only your designated Super Admin can register schools.
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(
      authorization.substring(7)
    );

    const superAdminUid = process.env.SUPER_ADMIN_UID;

    if (!superAdminUid || decoded.uid !== superAdminUid) {
      return NextResponse.json(
        { error: "You are not authorised to register schools." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const requiredFields = [
      "schoolName",
      "country",
      "region",
      "town",
      "schoolEmail",
      "phone",
      "schoolType",
      "educationLevel",
      "contactName",
      "contactPosition",
      "contactEmail",
      "contactPhone",
    ];

    for (const field of requiredFields) {
      if (!String(body[field] || "").trim()) {
        return NextResponse.json(
          { error: `Please provide ${field}.` },
          { status: 400 }
        );
      }
    }

    const adminEmail = String(body.contactEmail).trim().toLowerCase();

    const schoolRef = adminDb.collection("schools").doc();
    const schoolId = schoolRef.id;

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const invitationRef = adminDb
      .collection("schoolAdminInvitations")
      .doc(tokenHash);

    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    const schoolData = {
      schoolId,
      schoolName: String(body.schoolName).trim(),
      abbreviation: String(body.abbreviation || "").trim(),
      country: String(body.country).trim(),
      region: String(body.region).trim(),
      town: String(body.town).trim(),
      schoolEmail: String(body.schoolEmail).trim().toLowerCase(),
      phone: String(body.phone).trim(),
      website: String(body.website || "").trim(),
      schoolType: String(body.schoolType).trim(),
      educationLevel: String(body.educationLevel).trim(),
      contactName: String(body.contactName).trim(),
      contactPosition: String(body.contactPosition).trim(),
      contactEmail: adminEmail,
      contactPhone: String(body.contactPhone).trim(),
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      createdBy: decoded.uid,
    };

 const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin");

    if (!appUrl) {
      return NextResponse.json(
        { error: "Application URL is not configured." },
        { status: 500 }
      );
    }
    const batch = adminDb.batch();

    // Create the school.
    batch.set(schoolRef, schoolData);

    // Create its initial settings using the existing settings path.
    batch.set(
      schoolRef.collection("settings").doc("general"),
      {
        identity: {
          schoolName: schoolData.schoolName,
          abbreviation: schoolData.abbreviation,
          country: schoolData.country,
          region: schoolData.region,
          town: schoolData.town,
          address: schoolData.town,
          email: schoolData.schoolEmail,
          phone: schoolData.phone,
          website: schoolData.website,
        },
        institution: {
          schoolType: schoolData.schoolType,
          educationLevel: schoolData.educationLevel,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Create a single-use invitation for the first Technical Admin.
    batch.set(invitationRef, {
      schoolId,
      schoolName: schoolData.schoolName,
      email: adminEmail,
      contactName: schoolData.contactName,
      role: "technical_admin",
      status: "pending",
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: decoded.uid,
    });

    await batch.commit();

   

    const invitationUrl = new URL("/accept-school-invitation", appUrl);
    invitationUrl.searchParams.set("token", token);

    const whatsappMessage = encodeURIComponent(
      `Hello ${schoolData.contactName},\n\nYour school ${schoolData.schoolName} has been registered on GODSPEED SCHOLAR.\n\nPlease use this secure invitation link to create your Technical Administrator account:\n${invitationUrl.toString()}\n\nThis invitation expires in 7 days.`
    );

    return NextResponse.json({
      success: true,
      schoolId,
      schoolName: schoolData.schoolName,
      invitationUrl: invitationUrl.toString(),
      whatsappUrl: `https://wa.me/${schoolData.contactPhone.replace(/\D/g, "")}?text=${whatsappMessage}`,
      email: adminEmail,
      expiresInDays: 7,
    });
  } catch (error) {
    console.error("School registration error:", error);

    return NextResponse.json(
      { error: "Unable to register school. Please try again." },
      { status: 500 }
    );
  }
}