import React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    // The outer div structure might need adjustment based on how AppSidebar handles its positioning (fixed, absolute, etc.)
    // Assuming AppSidebar is meant to be fixed/sticky on the left.
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Assuming AppSidebar handles its own visibility toggle for mobile (offcanvas?) */}
      <AppSidebar className="group fixed inset-y-0 left-0 z-50 hidden w-14 flex-col border-r bg-background sm:flex data-[collapsible=true]/sidebar:hidden data-[collapsible=offcanvas]/sidebar:flex data-[collapsible=offcanvas]/sidebar:-translate-x-full" />

      {/* Adjust left padding based on sidebar width (sm:pl-14) */}
      <div className="flex flex-col sm:pl-14">
        <SiteHeader />
        <main className="flex-1 p-4 pt-6 sm:px-6 sm:py-6">
          {children} {/* Where the routed page content will go */}
        </main>
      </div>
    </div>
  );
} 