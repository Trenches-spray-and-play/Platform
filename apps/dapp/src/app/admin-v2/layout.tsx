import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Trenches",
  description: "Administrative dashboard for managing the Trenches platform",
};

export default function AdminV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
