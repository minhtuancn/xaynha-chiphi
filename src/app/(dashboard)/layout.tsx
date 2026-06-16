import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import { getUserSetting } from "@/actions/user-settings";

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

  const userSettings = await getUserSetting();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <DashboardLayoutClient initialSettings={userSettings}>
          <Sidebar />
          <div className="md:ml-64">
            <Header
              userName={user.name}
              userEmail={user.email}
              userRole={user.role}
            />
            <main id="main-content" className="p-4 md:p-6">{children}</main>
          </div>
        </DashboardLayoutClient>
      </div>
    </SidebarProvider>
  );
}
