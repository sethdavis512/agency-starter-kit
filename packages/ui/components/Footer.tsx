import { Container } from './Container';
import { cn } from '../utils/cn';

export function Footer({ className }: { className?: string }) {
    return (
        <footer className={cn('bg-neutral text-white py-8', className)}>
            <Container>
                <div className="text-center text-sm text-muted">
                    © {new Date().getFullYear()} Stealthy Chicken. All rights
                    reserved.
                </div>
            </Container>
        </footer>
    );
}
