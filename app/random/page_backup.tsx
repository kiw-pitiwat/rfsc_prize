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
        }  catch (err: unknown) {
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
                    prize_id:null,
                    prize_name:null,
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
                desc : d.prize_desc
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
                                className="grid gap-4"
                                style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                            >
                                {reels.map((item, i) => {
                                    const { first, last } = splitThaiFullName(item.MEMBER_NAME);
                                    return (
                                        <motion.div
                                            key={`slot-${i}-${item.MEMBER_NO}`}
                                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                                            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-green-coop p-2 shadow-lg"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-white opacity-70" />
                                            <div className="relative">
                                                {/* <div className="text-m text-center font-bold text-slate-800">ลำดับ {i + 1} </div> */}
                                                <div className="relative flex items-center justify-center">

                                                    {/* ข้อความอยู่กลางจริง */}
                                                    <div className="text-m text-center font-bold text-slate-800">
                                                        ลำดับ {i + 1}
                                                    </div>
                                                    {/* ปุ่ม X ซ้ายสุด */}
                                                    <button
                                                        onClick={() => {
                                                            setReels(prev =>
                                                                prev.filter(v => v.MEMBER_NO != item.MEMBER_NO)
                                                            );
                                                        }}
                                                        className="absolute right-0 top-1/2 -translate-y-1/2
                                                    rounded-full p-1 
                                                    hover:bg-gray-300 hover:text-slate-800 text-black"
                                                        aria-label="remove"
                                                    >
                                                        <b>X</b>
                                                    </button>
                                                </div>
                                                <motion.div
                                                    animate={isSpinning ? { y: [0, -10, 0], scale: [1, 1.03, 1] } : { y: 0, scale: 1 }}
                                                    transition={isSpinning ? { duration: 0.32, repeat: Infinity } : {}}
                                                    className="mt-1 rounded-2xl border border-slate-200 bg-white px-0 py-6 text-center shadow-sm"
                                                >

                                                    <div className="text-2xl text-center font-bold text-slate-800">
                                                        {isSpinning ? (
                                                            'กำลังสุ่ม…'
                                                        ) : (
                                                            `เลขสมาชิก: ${item.MEMBER_NO}`
                                                        )}
                                                    </div>
                                                    <div className=" font-extrabold tracking-wide text-3xl">
                                                        {first} <br /> {last}
                                                    </div>

                                                    {/* <div className="mt-2 text-sm text-slate-800">
                                                        {isSpinning ? (
                                                            'กำลังสุ่ม…'
                                                        ) : (
                                                            `กลุ่มผู้แทน : ${item.GROUP_NAME}`
                                                        )}
                                                    </div> */}
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )
                                }
                                )}
                            </div>

                            {/* Controls */}
                            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                <button
                                    onClick={startDraw}
                                    disabled={isSpinning || !canDraw}
                                    className="w-full max-w-xs border-2 border-gray-50 rounded-2xl bg-slate-900 px-6 py-3 text-base font-bold text-white shadow disabled:opacity-50"
                                >
                                    {isSpinning ? 'กำลังสุ่ม…' : 'เริ่มสุ่ม'}
                                </button>

                                <button
                                    disabled={isSpinning || !canDraw}
                                    onClick={resetAll}
                                    className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                                >
                                    รีเซ็ต
                                </button>
                            </div>
                            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
                <h1 className="text-xl font-semibold text-center mb-3">
                    รายชื่อผู้โชคดี
                </h1>

                {/* Scroll container */}
                <div className="h-[calc(80vh-60px)] overflow-y-auto pr-1 ">
                    <div className="space-y-2 ml-1">
                        {winners.map((u, i) => (
                            <div
                                key={u.MEMBER_NO}
                                className="rounded-xl border border-slate-200 bg-white p-1 shadow-sm hover:bg-slate-50 transition"
                            >
                                <div className="flex items-start gap-3">
                                    {/* index badge */}
                                    <div className="flex h-7 w-7 items-center ali justify-center rounded-full bg-slate-900 text-white text-sm font-semibold">
                                        {i + 1}
                                    </div>
                                    {/* text */}
                                    <div className="min-w-0">
                                        <div className="text-lg text-slate-900 truncate text-black">
                                            {u.MEMBER_NAME} <span className="text-slate-900 font-medium">({u.MEMBER_NO})</span>
                                        </div>
                                        {/* <div className="text-m text-slate-600 mt-0.5">
                                            กลุ่มผู้แทน : <span className="font-medium text-slate-700">{u.GROUP_NAME}</span>
                                        </div> */}
                                        <div className="text-lg mt-0.5 text-black">
                                            ของรางวัล : <span className="font-medium text-slate-900">{u.prize_name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className='mt-3 ml-1'>
                    {
                        winners.length > 0 ? (

                            <div style={{ alignItems: "center" }}>
                                <button
                                    onClick={() => {
                                        saveMember();
                                    }}
                                    className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                                >
                                    บันทึกรายชื่อผู้โชคดี
                                </button>
                            </div>
                        )
                            : null
                    }
                </div>
            </div>
        </div>
    );
}
