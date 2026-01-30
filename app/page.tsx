"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { USERITEM } from "./types";


export default function HomePage() {

    const [users, setUsers] = useState<USERITEM[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                setError("");
                const res = await fetch("/api/getmember", { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: { ok: boolean; data: USERITEM[] } = await res.json();
                if (!cancelled) setUsers(json.data ?? []);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "Failed to load");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-semibold">รายชื่อ</h1>
            <p className="text-slate-600">List Member</p>
            <div className="space-y-4">
                {loading && <div className="text-slate-600">Loading...</div>}
                {!!error && (
                    <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
                        Error: {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="space-y-2">
                        {users.map((u) => (
                            <div
                                key={u.MEMBER_NO}
                                className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
                            >
                                <div className="font-medium">{u.MEMBER_NAME}</div>
                                <div className="text-sm text-slate-600">{u.GROUP_NAME}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

    );
}
