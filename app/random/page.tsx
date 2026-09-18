'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { PRIZEITEM, USERITEM } from '../types';
import { pre } from 'framer-motion/client';
import Dropdown, { DropdownOption } from '../src/components/dropdown';

type ApiResponse = {
    ok: boolean;
    data: USERITEM[];
};

type ApiPrizeResponse = {
    ok: boolean;
    data: PRIZEITEM[];
};
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function pickUniqueUsersByMemberNo(list: USERITEM[], k: number): USERITEM[] {
    const s = shuffle(list);

    const out: USERITEM[] = [];
    const seen = new Set<number>();

    for (const u of s) {
        if (!u || typeof u.MEMBER_NO !== 'number') continue;
        if (seen.has(u.MEMBER_NO)) continue;
        seen.add(u.MEMBER_NO);
        out.push(u);
        if (out.length >= k) break;
    }
    return out;
}

function fireConfetti(): void {
    const end = Date.now() + 200;

    const tick = () => {
        confetti({
            particleCount: 10,
            spread: 50,
            origin: { x: Math.random() * 0.6 + 0.2, y: 0.35 },
        });

        if (Date.now() < end) requestAnimationFrame(tick);
    };

    tick();
}
type DropdownValue = number;
export default function Page() {
    const [users, setUsers] = useState<USERITEM[]>([]);
    const [candidates, setCandidates] = useState<USERITEM[]>([]);

    const [drawCount, setDrawCount] = useState<number>(5);

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [isSpinning, setIsSpinning] = useState<boolean>(false);
    const [reels, setReels] = useState<USERITEM[]>([]);
    const [winners, setWinners] = useState<USERITEM[]>([]);
    const [checked, setChecked] = useState(false);

    // กันซ้ำข้ามรอบด้วย MEMBER_NO
    // const [historyNos, setHistoryNos] = useState<number[]>([]);

    const intervalsRef = useRef<number[]>([]);
    const lastFetchControllerRef = useRef<AbortController | null>(null);
    const [options, setOptions] = useState<DropdownOption<DropdownValue>[]>([]);
    const [value, setValue] = useState<DropdownValue | null>(null);

    const pool = useMemo(() => {
        const won = new Set<number>([]);
        //return candidates.filter((u) => !won.has(u.MEMBER_NO));
        return candidates
    }, [candidates]);

    const canDraw = useMemo(() => {
        const k = Math.max(1, Math.min(50, Math.floor(drawCount || 1)));
        return pool.length >= k && pool.length > 0 && !loading;
    }, [pool.length, drawCount, loading]);

    // ✅ บังคับไม่เกิน 5 กล่อง/แถวเสมอ
    const gridCols = useMemo(() => {
        const k = Math.max(1, Math.min(50, Math.floor(drawCount || 1)));
        return Math.min(3, k); // >5 = 5 กล่อง/แถว, <=5 = เท่าจำนวน
    }, [drawCount]);

    const stopAllIntervals = (): void => {
        intervalsRef.current.forEach((id) => window.clearInterval(id));
        intervalsRef.current = [];
    };

    const saveMember = async () => {
        // ✅ confirm ก่อนบันทึก
        const ok = window.confirm(`ยืนยันบันทึกผู้ถูกรางวัลจำนวน ${winners.length} รายการใช่ไหม?`);
        if (!ok) return;

        try {
            const res = await fetch("/api/insertmember", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(winners), // USERITEM[]
            });

            // ✅ อ่าน json แบบปลอดภัย
            let json = null;
            try {
                json = await res.json();
            } catch {
                json = null;
            }

            if (!res.ok) {
                const msg = json?.message || json?.error || `HTTP ${res.status}`;
                throw new Error(msg);
            }

            console.log(json);

            // ✅ แจ้งสำเร็จ
            alert("บันทึกผู้ถูกรางวัลสำเร็จ ✅");

            // ✅ refresh + reset state ตามเดิม
            getMember();
            fetchPrizeItems();
            stopAllIntervals();
            setIsSpinning(false);
            setReels([]);
            setWinners([]);
        } catch (err: unknown) {
            console.error(err);
            const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "เกิดข้อผิดพลาด";
            alert(`บันทึกไม่สำเร็จ ❌\n${msg || "เกิดข้อผิดพลาด"}`);
        }
    }

    const resetAll = (): void => {
        stopAllIntervals();
        setIsSpinning(false);
        setReels([]);
        setWinners([]);
        // setHistoryNos([]);
    };

    const startDraw = (): void => {
        if (isSpinning) return;


        const k = Math.max(1, Math.min(50, Math.floor(drawCount || 1)));

        if (loading) return;
        if (pool.length === 0) return;
        if (k > pool.length) return;

        setIsSpinning(true);
        // setWinners([]);
        stopAllIntervals();
        // เริ่มต้น reels
        setReels(Array.from({ length: k }, () => pool[Math.floor(Math.random() * pool.length)]));
        console.log('Starting draw for', k, 'winners from pool of', pool.length);
        console.log('setReels 1 :', Array.from({ length: k }, () => pool[Math.floor(Math.random() * pool.length)]));

        const picked: USERITEM[] = pickUniqueUsersByMemberNo(pool.filter(p => !winners.find(w => w.MEMBER_NO === p.MEMBER_NO)), k); // ดึงผู้โชคดี

        console.log('Picked winners:', picked);

        for (let i = 0; i < k; i++) {

            const intervalId = window.setInterval(() => {
                setReels((prev) => {
                    const next = [...prev];
                    next[i] = pool[Math.floor(Math.random() * pool.length)];
                    return next;
                });
            }, 55 + i * 8);

            console.log('setReels ', i, ' :', pool[Math.floor(Math.random() * pool.length)]);

            intervalsRef.current.push(intervalId);

            const stopAfter = 1000 + i * 420;
            window.setTimeout(() => {
                window.clearInterval(intervalId);

                setReels((prev) => {
                    const next = [...prev];
                    next[i] = picked[i];
                    return next;
                });

                if (i === k - 1) {
                    window.setTimeout(() => {
                        // setWinners(picked);
                        // setHistoryNos((h) => [...h, ...picked.map((x) => x.MEMBER_NO)]);
                        setIsSpinning(false);
                        fireConfetti();
                    }, 320);
                }
            }, stopAfter);
        }

        console.log('displayList', reels)
    };

    let cancelled = false;

    const getMember = async () => {
        const controller = new AbortController();
        lastFetchControllerRef.current = controller;
        try {
            setLoading(true);
            setError('');
            const res: Response = await fetch('/api/getmember', {
                cache: 'no-store',
                signal: controller.signal,
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json: ApiResponse = await res.json();
            const list: USERITEM[] = Array.isArray(json.data) ? json.data : [];

            const seen = new Set<number>();
            const cleaned: USERITEM[] = [];

            for (const u of list) {
                if (!u) continue;
                if (typeof u.MEMBER_NO !== 'number') continue;
                if (seen.has(u.MEMBER_NO)) continue;
                seen.add(u.MEMBER_NO);

                cleaned.push({
                    MEMBER_NO: u.MEMBER_NO,
                    MEMBER_NAME: (u.MEMBER_NAME ?? '').toString(),
                    GROUP_NAME: (u.GROUP_NAME ?? '').toString(),
                    DEPARTMENT: (u.DEPARTMENT ?? '').toString(),
                    AFFILIATION: (u.AFFILIATION ?? '').toString(),
                    prize_id: null,
                    prize_name: null,
                });
            }

            if (!cancelled) {
                setUsers(cleaned);
                setCandidates(cleaned);
            }
        } catch (err: unknown) {
            const isAbort = err instanceof DOMException && err.name === 'AbortError';
            if (!cancelled && !isAbort) setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            if (!cancelled) setLoading(false);
        }

        cancelled = true;
        // controller.abort();
    }


    const fetchPrizeItems = async () => {
        try {
            const res: Response = await fetch('/api/getitemprize', {
                cache: 'no-store',
                // signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json: ApiPrizeResponse = await res.json();
            const list: PRIZEITEM[] = Array.isArray(json.data) ? json.data : [];

            // map -> DropdownOption
            const mapped: DropdownOption<DropdownValue>[] = list.map((d) => ({
                value: d.prize_id,
                label: d.prize_name,
            }));
            setOptions(mapped);

            // ตั้งค่าเริ่มต้น (เลือกตัวแรก) ถ้ายังไม่มีค่า
            setValue((prev) => prev ?? (mapped[0]?.value ?? null));
        } catch (error) {
            console.error("Failed to fetch prize items:", error);
        }
    }

    // initial load
    useEffect(() => {
        getMember();
        fetchPrizeItems();
        return () => {
            stopAllIntervals();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const splitThaiFullName = (fullName = "") => {
        const parts = fullName.trim().split(/\s+/); // ตัดช่องว่างซ้ำๆ
        if (parts.length <= 1) return { first: fullName.trim(), last: "" };
        return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
    };

    return (
        <div className='mx-auto px-1 flex '>
            <div className='flex-4'>
                <div className="relative min-h-screen w-full  text-slate-900">
                    {/* HUD */}
                    <div className=" flex items-center gap-2 o">
                        <div className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 text-s text-slate-900 shadow-sm">
                            เหลือรายชื่อ {pool.length} คน
                        </div>

                        <div className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 text-s text-slate-900 shadow-sm">
                            สุ่มต่อรอบ
                            <input
                                type="text"
                                value={drawCount}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "").trim();
                                    setDrawCount(value == "" ? drawCount : Number(value));
                                }}
                                className="rounded-2xl border border-slate-200 bg-white px-1 ml-0.5 text-base text-slate-900 outline-none focus:border-slate-400"
                            />
                        </div>
                        <div >
                            <Dropdown
                                label="ของรางวัล"
                                options={options}
                                value={value}
                                onChange={(val) => setValue(val)}
                                placeholder={loading ? "กำลังโหลด..." : "กรุณาเลือก"}
                                disabled={loading || !!error || options.length === 0}
                            />
                        </div>
                    </div>

                    {/* Main stage */}
                    <div className="relative z-10 flex min-h-screen flex-col items-center mt-0 justify-center px-2">
                        <AnimatePresence>
                            {!isSpinning && winners.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 14 }}
                                    className="mb-2 text-center"
                                >
                                    <div className="text-3xl font-extrabold tracking-wide sm:text-5xl text-white">
                                        จับรางวัล
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600 sm:text-base">
                                        กดปุ่มด้านล่างเพื่อเริ่มสุ่ม
                                    </div>
                                    {error ? (
                                        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                                            โหลดรายชื่อไม่สำเร็จ: {error}
                                        </div>
                                    ) : null}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {!isSpinning && reels.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 14 }}
                                    className="mt-0 mb-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-2 text-center shadow-sm"
                                >
                                    <div className="text-3xl font-semibold text-emerald-800">
                                        🎉 ยินดีกับผู้ได้รับรางวัล!
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>


                        <div className="w-full max-w-6xl">
                            {/* ✅ Grid: บังคับไม่เกิน 5 กล่อง/แถว */}
                            <div
                                className="grid gap-5"
                                style={{
                                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
                                }}
                            >
                                {reels.map((item, i) => {
                                    const { first, last } = splitThaiFullName(item.MEMBER_NAME);

                                    return (
                                        <motion.div
                                            key={`slot-${i}-${item.MEMBER_NO}`}

                                            initial={{
                                                opacity: 0,
                                                y: 20,
                                                scale: 0.96
                                            }}

                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1
                                            }}

                                            transition={{
                                                type: "spring",
                                                stiffness: 220,
                                                damping: 20
                                            }}

                                            className={`
                    relative
                    overflow-hidden
                    rounded-[30px]
                    border
                    p-3

                    transition-all
                    duration-300

                    ${isSpinning
                                                    ? `
                                border-sky-300
                                bg-[#EDF8FF]
                                shadow-[0_0_0_3px_rgba(56,189,248,0.15),0_18px_45px_rgba(14,165,233,0.25)]
                            `
                                                    : `
                                border-white/80
                                bg-[#F8FBFC]
                                shadow-[0_12px_35px_rgba(0,50,80,0.14)]
                            `
                                                }
                `}
                                        >

                                            {/* ==============================
                    TOP HEADER
                ============================== */}
                                            <div
                                                className="
                        relative
                        flex
                        h-12
                        items-center
                        justify-center
                    "
                                            >

                                                {/* ลำดับ */}
                                                <div
                                                    className={`
                            rounded-full
                            px-6
                            py-2

                            text-[16px]
                            font-bold

                            ${isSpinning
                                                            ? "bg-[#168AE5] text-white"
                                                            : i === 0
                                                                ? "bg-[#E3F6EE] text-[#008B68]"
                                                                : i === 1
                                                                    ? "bg-[#E8F2FF] text-[#2674C7]"
                                                                    : "bg-[#FFF0E8] text-[#D46632]"
                                                        }
                        `}
                                                >
                                                    ลำดับ {i + 1}
                                                </div>


                                                {/* ปุ่ม X */}
                                                <button
                                                    onClick={() => {
                                                        setReels(prev =>
                                                            prev.filter(
                                                                v => v.MEMBER_NO != item.MEMBER_NO
                                                            )
                                                        );
                                                    }}
                                                    className="
                            absolute
                            right-0
                            top-1/2
                            flex
                            h-9
                            w-9
                            -translate-y-1/2
                            items-center
                            justify-center

                            rounded-full

                            bg-[#EAF0F3]

                            text-[17px]
                            font-bold
                            text-[#365269]

                            transition-all
                            duration-200

                            hover:scale-105
                            hover:bg-[#DCE6EA]

                            active:scale-90
                        "
                                                    aria-label="remove"
                                                >
                                                    ✕
                                                </button>

                                            </div>


                                            {/* ==============================
                    CONTENT
                ============================== */}
                                            <div
                                                className="
                        relative
                        mt-2
                        overflow-hidden
                        rounded-[24px]

                        bg-white

                        px-5
                        py-6

                        text-center

                        shadow-[inset_0_0_0_1px_rgba(15,60,80,0.06)]
                    "
                                            >

                                                {isSpinning ? (

                                                    /* ==========================
                                                        SPINNING
                                                    ========================== */
                                                    <div
                                                        className="
                                flex
                                h-[180px]
                                flex-col
                                items-center
                                justify-center
                            "
                                                    >

                                                        {/* Animated Circle */}
                                                        <div
                                                            className="
                                    relative
                                    mb-5
                                    flex
                                    h-20
                                    w-20
                                    items-center
                                    justify-center
                                "
                                                        >

                                                            {/* Outer spinner */}
                                                            <motion.div
                                                                animate={{
                                                                    rotate: 360
                                                                }}
                                                                transition={{
                                                                    duration: 0.9,
                                                                    repeat: Infinity,
                                                                    ease: "linear"
                                                                }}
                                                                className="
                                        absolute
                                        inset-0

                                        rounded-full

                                        border-[5px]
                                        border-sky-100
                                        border-t-[#168AE5]
                                        border-r-cyan-400
                                    "
                                                            />


                                                            {/* Inner */}
                                                            <motion.div
                                                                animate={{
                                                                    scale: [1, 1.15, 1]
                                                                }}
                                                                transition={{
                                                                    duration: 0.8,
                                                                    repeat: Infinity
                                                                }}
                                                                className="
                                        flex
                                        h-14
                                        w-14
                                        items-center
                                        justify-center

                                        rounded-full

                                        bg-gradient-to-br
                                        from-sky-100
                                        to-blue-200

                                        text-2xl
                                    "
                                                            >
                                                                👤
                                                            </motion.div>

                                                        </div>


                                                        {/* Text */}
                                                        <motion.div
                                                            animate={{
                                                                opacity: [0.55, 1, 0.55]
                                                            }}
                                                            transition={{
                                                                duration: 1,
                                                                repeat: Infinity
                                                            }}
                                                            className="
                                    text-[24px]
                                    font-extrabold
                                    text-[#075985]
                                "
                                                        >
                                                            กำลังสุ่ม...
                                                        </motion.div>


                                                        {/* Animated dots */}
                                                        <div className="mt-3 flex gap-2">

                                                            {[0, 1, 2].map(dot => (
                                                                <motion.div
                                                                    key={dot}
                                                                    animate={{
                                                                        y: [0, -6, 0]
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.55,
                                                                        repeat: Infinity,
                                                                        delay: dot * 0.12
                                                                    }}
                                                                    className="
                                            h-2.5
                                            w-2.5
                                            rounded-full
                                            bg-sky-400
                                        "
                                                                />
                                                            ))}

                                                        </div>

                                                    </div>

                                                ) : (

                                                    /* ==========================
                                                        RESULT
                                                    ========================== */
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            scale: 0.94
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: 1
                                                        }}
                                                        className="
                                flex
                                flex-col
                                items-center
                                justify-center
                            "
                                                    >

                                                        {/* Member Number */}
                                                        <div
                                                            className="
                                    mb-2
                                    rounded-full
                                    bg-[#EEF4F6]

                                    px-5
                                    py-1

                                    text-[18px]
                                    font-semibold
                                    text-[#3D5B6C]
                                "
                                                        >
                                                            เลขสมาชิก:

                                                            <span
                                                                className="
                                        ml-2
                                        text-[22px]
                                        font-extrabold
                                        text-[#062B46]
                                    "
                                                            >
                                                                {item.MEMBER_NO}
                                                            </span>
                                                        </div>


                                                        {/* Name */}
                                                        <div
                                                            className="
                                    text-[30px]
                                    font-extrabold
                                    leading-[1.35]
                                    tracking-wide
                                    text-[#071E3D]
                                "
                                                        >
                                                            {first}

                                                            <br />

                                                            {last}
                                                        </div>

                                                    </motion.div>

                                                )}

                                            </div>


                                            {/* ==============================
                    BOTTOM COLOR ACCENT
                ============================== */}
                                            <div
                                                className={`
                        absolute
                        bottom-0
                        left-[10%]
                        h-[4px]
                        w-[80%]
                        rounded-full

                        ${isSpinning
                                                        ? "bg-sky-400"
                                                        : i === 0
                                                            ? "bg-emerald-400"
                                                            : i === 1
                                                                ? "bg-blue-400"
                                                                : "bg-orange-400"
                                                    }
                    `}
                                            />

                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Controls */}

                            {
                                reels.length > 0 && isSpinning == false ?
                                    <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                        <button
                                            disabled={isSpinning || !canDraw}
                                            onClick={resetAll}
                                            className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                                        >
                                            รีเซ็ต
                                        </button>
                                        <button
                                            disabled={isSpinning || !canDraw}
                                            onClick={() => {
                                                // saveMember
                                                const selectedPrize = options.find(o => o.value === value);
                                                if (!selectedPrize) return; // ✅ ทำให้ด้านล่างไม่เป็น undefined
                                                const updatedReels: USERITEM[] = reels.map((u) => ({
                                                    ...u,
                                                    prize_id: selectedPrize?.value,
                                                    prize_name: selectedPrize?.label,

                                                }));
                                                setWinners(prev => [...prev, ...updatedReels]);
                                                setReels([]);
                                            }}
                                            className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                                        >
                                            จัดเก็บรายชื่อ
                                        </button>
                                    </div>
                                    :

                                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                        <button
                                            onClick={startDraw}
                                            disabled={isSpinning || !canDraw}
                                            className="
                                            group
                                            relative
                                            flex h-50 w-50
                                            shrink-0
                                            items-center justify-center
                                            rounded-full
                                            border-[6px] border-[#FF8A8A]

                                            bg-gradient-to-b
                                            from-[#FF4B4B]
                                            via-[#E51D2A]
                                            to-[#B90E19]

                                            text-xl
                                            font-extrabold
                                            text-white

                                            shadow-[0_12px_0_#8F0B14,0_18px_28px_rgba(130,0,0,0.35),inset_0_4px_5px_rgba(255,255,255,0.35)]

                                            transition-all
                                            duration-100
                                            ease-out

                                            hover:brightness-110

                                            active:translate-y-[9px]
                                            active:shadow-[0_3px_0_#8F0B14,0_7px_12px_rgba(130,0,0,0.25),inset_0_3px_8px_rgba(120,0,0,0.25)]

                                            disabled:cursor-not-allowed
                                            disabled:opacity-50
                                            disabled:active:translate-y-0
                                        "
                                        >
                                            {/* แสงสะท้อนด้านบน */}
                                            <span
                                                className="
                                                        pointer-events-none
                                                        absolute
                                                        left-[20%]
                                                        top-[12%]
                                                        h-[25%]
                                                        w-[60%]
                                                        rounded-full
                                                        bg-white/20
                                                        blur-[1px]
                                                    "
                                            />

                                            <span className="relative z-10 text-4xl font-bold text-center leading-tight">
                                                {isSpinning ? (
                                                    <>
                                                        กำลังสุ่ม...
                                                    </>
                                                ) : (
                                                    <>
                                                        เริ่มสุ่ม
                                                    </>
                                                )}
                                            </span>
                                        </button>
                                    </div>

                            }

                            <div className="mt-3 text-center text-xs text-slate-500">
                                โหลดสมาชิกทั้งหมด: <b >{users.length}</b> คน
                                {loading ? <span className="ml-2">• กำลังโหลด…</span> : null}
                                <span className="ml-2">• แถวละ {gridCols} กล่อง</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0 border-l-1 border-slate-200 ">
                {/* =========================
    RIGHT WINNER PANEL
========================= */}
                <div
                    className="
        flex h-full min-h-0 flex-col
        rounded-[30px]
        border border-slate-200
        bg-[#F4F9FA]
        p-4
        shadow-[0_18px_45px_rgba(0,42,72,0.16)]
    "
                >
                    {/* Header */}
                    <div className="mb-4 flex items-center gap-3 px-2 pt-1">
                        {/* Gift Icon */}
                        <div
                            className="
                flex h-11 w-11 shrink-0
                items-center justify-center
                rounded-[15px]
                bg-[#E4F5ED]
                text-[23px]
            "
                        >
                            🎁
                        </div>

                        <div className="min-w-0">
                            <h1
                                className="
                    text-[25px]
                    font-bold
                    leading-none
                    text-[#06224A]
                "
                            >
                                รายชื่อผู้โชคดี
                            </h1>

                            <div className="mt-1.5 text-[13px] font-medium text-slate-500">
                                ผู้ได้รับรางวัลล่าสุด
                            </div>
                        </div>
                    </div>


                    {/* =========================
        SCROLL WINNER LIST
    ========================= */}
                    <div
                        className="
                            min-h-0 flex-1
                            overflow-y-auto
                            pr-1

                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar-track]:bg-transparent
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-thumb]:bg-slate-300
                        "
                    >
                        <div className="space-y-2.5">
                            {winners.map((u, i) => {

                                /* สีลำดับ */
                                const badgeColor =
                                    i === 0
                                        ? "bg-[#F4B61B] shadow-[0_4px_10px_rgba(244,182,27,0.35)]"
                                        : i === 1
                                            ? "bg-[#6999C7]"
                                            : i === 2
                                                ? "bg-[#D96B32]"
                                                : "bg-[#526E83]";

                                return (
                                    <div
                                        key={u.MEMBER_NO}
                                        className="
                                            group
                                            rounded-[20px]
                                            border border-[#E2EBED]
                                            bg-white
                                            px-3.5 py-3
                                            shadow-[0_4px_12px_rgba(0,45,70,0.07)]

                                            transition-all
                                            duration-200

                                            hover:-translate-y-[1px]
                                            hover:shadow-[0_7px_18px_rgba(0,45,70,0.12)]
                                        "
                                    >
                                        <div className="flex items-center gap-3">

                                            {/* =====================
                                INDEX BADGE
                            ====================== */}
                                            <div
                                                className={`
                                    flex
                                    h-10 w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full

                                    text-[17px]
                                    font-bold
                                    text-white

                                    ${badgeColor}
                                `}
                                            >
                                                {i + 1}
                                            </div>


                                            {/* =====================
                                MEMBER DETAIL
                            ====================== */}
                                            <div className="min-w-0 flex-1">

                                                {/* Member Name */}
                                                <div
                                                    className="
                                        truncate
                                        text-[17px]
                                        font-bold
                                        leading-[1.3]
                                        text-[#06224A]
                                    "
                                                >
                                                    {u.MEMBER_NAME}

                                                    <span className="ml-1 font-semibold text-[#183A59]">
                                                        ({u.MEMBER_NO})
                                                    </span>
                                                </div>


                                                {/* Prize */}
                                                <div
                                                    className="
                                        mt-1
                                        flex
                                        min-w-0
                                        items-center
                                        gap-1

                                        text-[14px]
                                        leading-tight
                                    "
                                                >
                                                    <span className="shrink-0 font-medium text-[#71818C]">
                                                        ของรางวัล :
                                                    </span>

                                                    <span
                                                        className="
                                            truncate
                                            font-semibold
                                            text-[#31556B]
                                        "
                                                    >
                                                        {u.prize_name}
                                                    </span>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    {/* =========================
        BOTTOM SAVE BUTTON
    ========================= */}
                    {winners.length > 0 && (
                        <div
                            className="
                mt-4
                border-t
                border-[#D9E5E8]
                pt-4
            "
                        >
                            <button
                                onClick={() => {
                                    saveMember();
                                }}
                                className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2.5

                    rounded-[20px]
                    border
                    border-[#DCE7E9]

                    bg-white

                    px-5
                    py-3.5

                    text-[16px]
                    font-bold
                    text-[#123B59]

                    shadow-[0_5px_15px_rgba(0,45,70,0.09)]

                    transition-all
                    duration-200

                    hover:-translate-y-[1px]
                    hover:bg-[#F9FCFC]
                    hover:shadow-[0_8px_20px_rgba(0,45,70,0.14)]

                    active:scale-[0.98]
                "
                            >
                                {/* Save icon */}
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-5 w-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 4h11l3 3v13H5V4Z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 4v6h8V4M8 16h8"
                                    />
                                </svg>

                                บันทึกรายชื่อผู้โชคดี
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
