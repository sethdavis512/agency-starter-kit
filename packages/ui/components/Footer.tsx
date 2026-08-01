import { Container } from "./Container";
import { BRAND_NAME } from "@repo/utils/brand";
import { cn } from "../utils/cn";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("bg-neutral-solid text-white py-8", className)}>
      <Container>
        <div className="text-center text-sm text-muted">
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
