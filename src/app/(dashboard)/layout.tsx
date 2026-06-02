import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/layout/theme-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email, deletedAt: null },
  });
  if (!user) redirect("/login");

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="ml-64">
          <Header
            userName={user.name}
            userEmail={user.email}
            userRole={user.role}
          />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
