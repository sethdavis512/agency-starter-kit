import { useState } from "react";
import { Header } from "@repo/ui/header";
import { Main } from "@repo/ui/main";
import { Footer } from "@repo/ui/footer";
import { Sidebar } from "@repo/ui/sidebar";
import { Container } from "@repo/ui/container";
import { Outlet } from "react-router";
import type { Route } from "./+types/site-layout";
import { userContext } from "@repo/auth/context";
import { populateSession } from "@repo/auth/middleware";

export const middleware: Route.MiddlewareFunction[] = [populateSession];

export async function loader({ context }: Route.LoaderArgs) {
  return { user: context.get(userContext) };
}

export default function SiteLayoutRoute({ loaderData }: Route.ComponentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthenticated = !!loaderData.user;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        variant="portal"
        isAuthenticated={isAuthenticated}
        onMenuToggle={function () {
          setSidebarOpen(!sidebarOpen);
        }}
      />
      <Container className="flex flex-1 gap-4">
        {isAuthenticated && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={function () {
              setSidebarOpen(false);
            }}
          />
        )}
        <Main className="flex-1 py-4">
          <Outlet />
        </Main>
      </Container>
      <Footer />
    </div>
  );
}
