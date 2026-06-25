import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aegis AI - Campus Integrity & Attendance Platform",
  description: "Enterprise-grade SaaS solution for face-recognition attendance, real-time exam malpractice logging, and plagiarism check.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
