import { useEffect, useRef } from "react";
import { Link, NavLink, type NavLinkRenderProps } from "react-router";
import { LayoutDashboard, User, LogOut, X } from "@repo/utils/icons";
import { BRAND_NAME } from "@repo/utils/brand";
import { cn } from "../utils/cn";

interface SidebarProps {
  variant?: "portal" | "admin";
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

function NavItem({
  to,
  icon: Icon,
  children,
  end = false,
  variant = "portal",
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  end?: boolean;
  variant?: "portal" | "admin";
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={function ({ isActive }: NavLinkRenderProps) {
        const activeClass =
          variant === "admin"
            ? "bg-primary/15 text-primary"
            : "bg-secondary/15 text-secondary";
        return cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive ? activeClass : "text-neutral hover:bg-muted",
        );
      }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </NavLink>
  );
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])';

export function Sidebar({
  className,
  variant = "portal",
  isOpen,
  onClose,
}: SidebarProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  function renderSidebarContent({ isMobile }: { isMobile: boolean }) {
    return (
      <div className="flex flex-col">
        {/* Logo - mobile only */}
        {isMobile && (
          <div className="flex items-center justify-between px-4 py-4">
            <Link to="/" onClick={onClose}>
              <p className="text-xl font-bold">🐔 {BRAND_NAME}</p>
            </Link>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close navigation menu"
              className="rounded-md p-1 text-neutral/50 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-1 px-3 py-4"
        >
          <NavItem
            to="/dashboard"
            icon={LayoutDashboard}
            end
            variant={variant}
          >
            Dashboard
          </NavItem>
          <NavItem to="/profile" icon={User} variant={variant}>
            Profile
          </NavItem>
        </nav>

        <div className="border-t border-neutral/15 px-3 py-4">
          <NavLink
            to="/sign-out"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Mobile sidebar */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Navigation menu"
        inert={!isOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-surface shadow-lg transition-transform duration-200 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {renderSidebarContent({ isMobile: true })}
      </aside>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-neutral/15 bg-surface",
          className,
        )}
      >
        {renderSidebarContent({ isMobile: false })}
      </aside>
    </>
  );
}
