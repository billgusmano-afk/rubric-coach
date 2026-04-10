import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RubricCoach — Sales Roleplay Coaching",
  description: "Practice sales conversations and get scored against custom rubrics with AI coaching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
