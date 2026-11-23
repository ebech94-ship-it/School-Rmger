import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teacher Invitation | GS Scholar",
  description:
    "You are invited to activate your teacher account on GS Scholar by GodSpeed Technologies.",

  openGraph: {
    title: "Welcome to GS Scholar",
    description:
      "Activate your teacher account and access your school's GS Scholar workspace.",
    url: "https://YOUR-ACTUAL-DOMAIN/accept-invitation",
    siteName: "GS Scholar",
    images: [
      {
        url: "https://YOUR-ACTUAL-DOMAIN/gss.jpg",
        alt: "GS Scholar by GodSpeed Technologies",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "Welcome to GS Scholar",
    description: "Activate your GS Scholar teacher account.",
    images: ["https://YOUR-ACTUAL-DOMAIN/gss.jpg"],
  },
};

export default function InvitationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}