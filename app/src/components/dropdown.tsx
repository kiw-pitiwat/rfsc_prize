import React, { useEffect, useMemo, useRef, useState } from "react";

export type DropdownOption<T extends string | number> = {
    value: T;
    label: string;
    disabled?: boolean;
};

type DropdownProps<T extends string | number> = {
    label?: string;
    options: DropdownOption<T>[];
    value: T | null;
    onChange: (value: T, option: DropdownOption<T>) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

export default function Dropdown<T extends string | number>({
    label,
    options,
    value,
    onChange,
    placeholder = "เลือก...",
    disabled = false,
    className = "",
}: DropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const selected = useMemo(
        () => options.find((o) => o.value === value) ?? null,
        [options, value]
    );

    // ปิด dropdown เมื่อคลิกนอกกล่อง
    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const handleSelect = (opt: DropdownOption<T>) => {
        if (opt.disabled) return;
        setOpen(false);
        onChange(opt.value, opt);
    };

    return (
        <div className={`w-full flex items-center ${className}`} ref={wrapperRef}>
            {label && <span className="pr-2 shrink-0 text-white">{label}</span>}

            {/* เปลี่ยนจาก flex-4 (ไม่มีใน tailwind) -> flex-1 และทำ relative */}
            <div className="relative flex-1 min-w-[220px]">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setOpen((v) => !v)}
                    className={[
                        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left shadow-sm",
                        disabled
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300",
                    ].join(" ")}
                >
                    <span className={`truncate ${selected ? "" : "text-slate-400"}`}>
                        {selected ? selected.label : placeholder}
                    </span>

                    <svg
                        className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>

                {open && !disabled && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                        <ul className="max-h-60 overflow-auto py-1">
                            {options.length === 0 ? (
                                <li className="px-3 py-2 text-sm text-slate-500">ไม่มีข้อมูล</li>
                            ) : (
                                options.map((opt) => {
                                    const active = opt.value === value;
                                    return (
                                        <li key={String(opt.value)}>
                                            <button
                                                type="button"
                                                disabled={opt.disabled}
                                                onClick={() => handleSelect(opt)}
                                                className={[
                                                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                                                    opt.disabled
                                                        ? "cursor-not-allowed text-slate-400"
                                                        : active
                                                            ? "bg-slate-100 font-semibold text-slate-800"
                                                            : "text-slate-700 hover:bg-slate-50",
                                                ].join(" ")}
                                            >
                                                <span className="truncate">{opt.label}</span>
                                                {active && <span className="text-slate-700">✓</span>}
                                            </button>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>

    );
}
