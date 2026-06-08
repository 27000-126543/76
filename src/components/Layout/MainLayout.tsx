import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar, type SidebarProps } from './Sidebar';
import { Header, type HeaderProps } from './Header';

export interface MainLayoutProps {
  sidebarProps?: Partial<SidebarProps>;
  headerProps?: Partial<HeaderProps>;
  className?: string;
  contentClassName?: string;
  showSidebar?: boolean;
  showHeader?: boolean;
}

export default function MainLayout({
  sidebarProps,
  headerProps,
  className,
  contentClassName,
  showSidebar = true,
  showHeader = true,
}: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'flex h-screen w-full overflow-hidden bg-dark-950 text-white',
        className
      )}
    >
      {showSidebar && (
        <Sidebar
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          {...sidebarProps}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0">
        {showHeader && <Header {...headerProps} />}

        <main
          className={cn(
            'flex-1 overflow-y-auto p-6',
            contentClassName
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
