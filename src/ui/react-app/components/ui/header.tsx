"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
    const pathname = usePathname();

    const navLinks = [
        { href: '/task-executor', label: 'Task Executor' },
        { href: '/system-view', label: 'System View' },
        { href: '/phase-doc', label: 'Phase Document' },
        { href: '/planning', label: 'Task Board' },
    ];

    return (
        <header className="bg-background border-b">
            <div className="container mx-auto flex h-16 items-center justify-between">
                <Link href="/" className="text-xl font-bold">Ora System</Link>
                <nav className="flex items-center space-x-6">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === link.href ? "" : "text-muted-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
} 