import LayoutClient from "./components/LayoutClient";

async function getUser() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/user`, { cache: 'no-store' });
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error("Failed to fetch user for layout:", error);
    return null;
  }
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <LayoutClient initialUser={user}>
      {children}
    </LayoutClient>
  );
}
