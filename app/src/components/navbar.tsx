"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menus = [
    // { href: "/", label: "Home" },
    { href: "/random", label: "สุ่มรายชื่อ" },
    { href: "/winners", label: "ผู้ได้รับรางวัล" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const isActive = (href: string) => pathname === href;

    return (
        <header className="sticky top-0 z-100 border-b border-slate-200 " style={{backgroundColor:'#090e32'}}>
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                {/* Brand */}
                <Link href="/random" className="flex items-center gap-2 font-semibold">
                    <span className="inline-flex h-10 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                        Forest Co-op
                    </span>
                    <span>สุ่มรายชื่อผู้โชคดี</span>
                </Link>

                {/* Desktop menu */}
                <nav className="hidden items-center gap-1 md:flex">
                    {menus.map((m) => {
                        const active = isActive(m.href);
                        return (
                            <Link
                                key={m.href}
                                href={m.href}
                                className={[
                                    "rounded-xl px-3 py-2 text-sm font-medium transition",
                                    active
                                        ? "bg-slate-900 text-white"
                                        : "text-gray-400 hover:bg-slate-100",
                                ].join(" ")}
                            >
                                {m.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right actions */}
           

                {/* Mobile button */}
                <button
                    className="rounded-xl p-2 hover:bg-slate-100 md:hidden"
                    onClick={() => setOpen((v) => !v)}
                    aria-label="Toggle menu"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                            d={open ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="border-t border-slate-200 bg-white md:hidden">
                    <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
                        {menus.map((m) => {
                            const active = isActive(m.href);
                            return (
                                <Link
                                    key={m.href}
                                    href={m.href}
                                    onClick={() => setOpen(false)}
                                    className={[
                                        "block rounded-xl px-3 py-2 text-sm font-medium",
                                        active
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-700 hover:bg-slate-100",
                                    ].join(" ")}
                                >
                                    {m.label}
                                </Link>
                            );
                        })}

                        <div className="pt-2">
                            <button className="w-full rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                                Sign in
                            </button>
                            <button className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
