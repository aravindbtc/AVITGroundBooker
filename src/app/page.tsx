import { Dashboard } from '@/components/dashboard/dashboard';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 bg-background/95 p-4 md:p-6 lg:p-8">
            <Dashboard />
          </main>
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
