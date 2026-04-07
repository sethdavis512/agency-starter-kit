import { Container } from './Container';
import { AppLink } from './AppLink';
import { cx } from '../utils/cva.config';

export function Footer({ className }: { className?: string }) {
    return (
        <footer className={cx('bg-zinc-800 text-white py-8', className)}>
            <Container>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    <div>
                        <h3 className="text-white font-semibold mb-4">
                            Company
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <AppLink to="/about" variant="light">
                                    About Us
                                </AppLink>
                            </li>
                            <li>
                                <AppLink to="/contact" variant="light">
                                    Contact
                                </AppLink>
                            </li>
                            <li>
                                <AppLink to="/careers" variant="light">
                                    Careers
                                </AppLink>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">
                            Support
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <AppLink to="/help" variant="light">
                                    Help Center
                                </AppLink>
                            </li>
                            <li>
                                <AppLink to="/faq" variant="light">
                                    FAQ
                                </AppLink>
                            </li>
                            <li>
                                <AppLink to="/support" variant="light">
                                    Support
                                </AppLink>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <AppLink to="/privacy" variant="light">
                                    Privacy Policy
                                </AppLink>
                            </li>
                            <li>
                                <AppLink to="/terms" variant="light">
                                    Terms of Service
                                </AppLink>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">
                            Connect
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <AppLink
                                    to="https://facebook.com"
                                    external
                                    variant="light"
                                >
                                    Facebook
                                </AppLink>
                            </li>
                            <li>
                                <AppLink
                                    to="https://twitter.com"
                                    external
                                    variant="light"
                                >
                                    X / Twitter
                                </AppLink>
                            </li>
                            <li>
                                <AppLink
                                    to="https://instagram.com"
                                    external
                                    variant="light"
                                >
                                    Instagram
                                </AppLink>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-700 text-center text-sm text-zinc-500">
                    © {new Date().getFullYear()} Stealthy Chicken. All rights reserved.
                </div>
            </Container>
        </footer>
    );
}
