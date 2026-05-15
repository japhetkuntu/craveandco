'use client';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { ROLE_NAV_ITEMS } from '@/lib/constants';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { LogOut, MoreHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';

const roleNavItems = ROLE_NAV_ITEMS;


export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navItems = roleNavItems[user.role] || [];
  const roleName = user.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const mobileMainItems = navItems.slice(0, 4);
  const mobileOverflowItems = navItems.slice(4);
  const hasOverflow = mobileOverflowItems.length > 0;

  return (
    <div className="min-h-full bg-surface-base">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-surface-raised border-r border-border-subtle transition-all duration-250',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]',
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border-subtle">
          {collapsed ? (
            <span className="text-xl font-bold text-gold block text-center">C</span>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gold">Crave & Co</h1>
              <p className="text-[0.6875rem] font-semibold text-text-tertiary uppercase tracking-widest mt-1">{roleName} Portal</p>
            </>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 h-12 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-gold-muted text-gold border-l-2 border-l-gold'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                  collapsed && 'justify-center px-0',
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && item.label}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border-subtle space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className="flex items-center gap-3 w-full px-3 h-10 rounded-xl text-sm font-medium text-text-tertiary hover:bg-surface-elevated hover:text-text-secondary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
          >
            {collapsed ? <ChevronRight size={20} aria-hidden="true" /> : <><ChevronLeft size={20} aria-hidden="true" /><span>Collapse</span></>}
          </button>
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className={cn(
              'flex items-center gap-3 w-full px-3 h-10 rounded-xl text-sm font-medium text-text-tertiary hover:bg-error-muted hover:text-error transition-all',
              collapsed && 'justify-center px-0',
            )}
          >
            <LogOut size={20} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile More Menu Overlay */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-surface-raised border-t border-border-default rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="text-sm font-bold text-text-primary">More</span>
              <button onClick={() => setMoreOpen(false)} className="p-2 text-text-tertiary hover:text-text-secondary rounded-lg">
                <X size={20} />
              </button>
            </div>
            <nav aria-label="More" className="px-3 pb-4 space-y-1">
              {mobileOverflowItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 h-12 rounded-xl text-sm font-medium transition-all',
                      active
                        ? 'bg-gold-muted text-gold'
                        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                );
              })}
              <button
                onClick={() => { logout(); window.location.href = '/login'; }}
                className="flex items-center gap-3 w-full px-4 h-12 rounded-xl text-sm font-medium text-error hover:bg-error-muted transition-all"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav.
       * When the soft keyboard is open we slide the nav off-screen instead of
       * floating it above the keyboard. Floating it caused two layout shifts:
       *   1. The nav jumped up the screen and overlapped the focused input.
       *   2. <main> kept its original bottom padding, so a gap opened at the
       *      bottom of the page on every focus event.
       * The `data-keyboard-open` attribute is set on <html> by
       * useVirtualKeyboard whenever visualViewport reports a keyboard offset.
       */}
      <nav
        aria-label="Primary"
        data-bottom-nav
        className="lg:hidden fixed inset-x-0 bottom-0 bg-surface-raised border-t border-border-subtle z-50 pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-bottom-nav)] transition-transform duration-200 ease-out"
      >
        <div className="flex justify-around py-2">
          {mobileMainItems.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-2 py-1 text-[10px] font-medium transition-colors',
                  active ? 'text-gold' : 'text-text-tertiary',
                )}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
          {hasOverflow && (
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="More navigation options"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={cn(
                'flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-2 py-1 text-[10px] font-medium transition-colors',
                moreOpen || mobileOverflowItems.some(i => pathname === i.href)
                  ? 'text-gold'
                  : 'text-text-tertiary',
              )}
            >
              <MoreHorizontal size={20} aria-hidden="true" />
              More
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className={cn(
        'pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0 transition-all duration-250 min-h-screen h-screen overflow-y-auto',
        collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]',
      )}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
