
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "School Invitation | GS Scholar",
  description:
    "You are invited to activate your school's workspace on GS Scholar by GodSpeed Technologies.",
  openGraph: {
    title: "Welcome to GS Scholar",
    description:
      "Simplify student records, academic results and school administration.",
    url: "https://gs-school.vercel.app/accept-school-invitation",
    siteName: "GS Scholar",
    images: [
      {
       url: "https://gs-school.vercel.app/opengraph-image",
        alt: "GS Scholar by GodSpeed Technologies",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Welcome to GS Scholar",
    description:
      "Your school is invited to join GS Scholar.",
    images: ["https://gs-school.vercel.app/opengraph-image"],
  },
};

export default function InvitationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
