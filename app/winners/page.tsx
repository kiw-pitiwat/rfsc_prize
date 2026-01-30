'use client';

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from 'react';
import { USERWINNER } from '../types';
// import 'react-tabulator/lib/styles.css';
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";
import { Tabulator, type TabulatorFull as TabulatorType } from "tabulator-tables";
// CSS ของ Tabulator

type ApiPrizeResponse = {
    ok: boolean;
    data: USERWINNER[];
};

// ✅ No SSR สำหรับ ReactTabulator (ทำในไฟล์เดียวได้)
const ReactTabulatorNoSSR = dynamic(
    async () => {
        const mod = await import("react-tabulator");
        const RT = mod.ReactTabulator;
        // ✅ wrapper ที่ส่ง ref ผ่าน prop
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return function WrappedTabulator({ forwardedRef, ...props }: any) {
            console.log('WrappedTabulator',forwardedRef)
            return <RT {...props} ref={forwardedRef} />;
        };
    },
    {
        ssr: false,
        loading: () => (
            <div className="p-6 text-sm text-slate-600">กำลังโหลดตาราง...</div>
        ),
    }
);
export default function Page() {
    const [listWinners, setListWinners] = useState<USERWINNER[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableRef = useRef<any>(null);
    const [table, setTable] = useState<TabulatorType | null>(null); // เก็บ instance จริง
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/getwinners', { cache: "no-store" });
            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const json: ApiPrizeResponse = await res.json();
            const data: USERWINNER[] = Array.isArray(json.data) ? json.data : [];
            console.log('fetchData', data)
            setListWinners(data)
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (!table) return;
        const kw = keyword.trim();
        if (!kw) return table.clearFilter(true);
        table.setFilter(
            [
                { field: "MEMBER_NO", type: "like", value: kw },
                { field: "MEMBER_NAME", type: "like", value: kw },
            ],
            "or"
        );
    }, [keyword, table]);

    const columns = useMemo<ColumnDefinition[]>(() => {
        return [
            { title: "No.", field: "row_num", sorter: "string", width: '10%' },
            { title: "เลขสมาชิก", field: "MEMBER_NO", sorter: "string", width: '20%' },
            { title: "ชื่อ-สกุล", field: "MEMBER_NAME", sorter: "string", width: '30%' },
            { title: "ของรางวัล", field: "PRIZE_NAME", sorter: "string", width: '20%' },
            {
                title: "วันที่บันทึก",
                field: "ENTRY_DATE",
                sorter: "datetime",
                formatter: (cell) => {
                    const v = cell.getValue();
                    const d = v ? new Date(v) : null;
                    if (!d || isNaN(d.getTime())) return "";
                    return d.toLocaleString("th-TH", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    }) + ' น.';
                },
                width: '20%'
            }
        ];
    }, []);


    // options
    const options = useMemo<ReactTabulatorOptions>(() => {
        return {
            // layout: "fitColumns",
            // height: "70vh",
            // ✅ pagination
            pagination: true,
            paginationSize: 20,
            paginationSizeSelector: [10, 20, 50, 100],
            placeholder: "ไม่มีข้อมูล",
        };
    }, []);

    // เก็บ instance table หลังสร้างเสร็จ
    const onTableBuilt = () => {
        const t = tableRef.current?.table as TabulatorType | undefined;
        if (t) setTable(t);

        console.log('onTableBuilt',t)
    };

    const exportCsv = () => {


        const t = tableRef.current?.table ?? tableRef.current; // ✅ กัน 2 แบบ
        console.log("ref", tableRef.current);
        console.log("table", tableRef.current?.table);
        console.log("download", tableRef.current?.table?.download);
        if (!t) return alert("ตารางยังไม่พร้อมใช้งาน");
        t.download("csv", "members.csv");
    };



    const clearWinner = async () => {
        // 1) confirm
        const ok = window.confirm("ยืนยันล้างรายชื่อผู้ถูกรางวัลทั้งหมดไหม?");
        if (!ok) return;

        try {
            const res = await fetch("/api/clearwinner", {
                method: "POST",
                // headers: { "Content-Type": "application/json" },
                // body: JSON.stringify(winners),
            });

            // 2) อ่าน response ให้ปลอดภัย (บางที API อาจไม่ส่ง json)
            let data = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            // 3) ถ้าไม่ ok -> โยน error พร้อมข้อความจาก API (ถ้ามี)
            if (!res.ok) {
                const msg =
                    data?.message || data?.error || `ล้มเหลว (HTTP ${res.status})`;
                throw new Error(msg);
            }

            console.log(data);
            fetchData()
            alert("ล้างรายชื่อผู้ถูกรางวัลสำเร็จ ✅");
        } catch (err: unknown) {
            console.error(err);
            const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "เกิดข้อผิดพลาด";
            alert(`ล้างรายชื่อไม่สำเร็จ ❌\n${msg}`);
        }
    };


    return (
        <div className='mx-auto px-1 flex '>

            <div className="w-full rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                    {/* <div className="flex items-center gap-2">
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="ค้นหา..."
                            className="w-full md:w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                        />
                        <button
                            onClick={() => setKeyword("")}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                        >
                            ล้าง
                        </button>
                    </div> */}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearWinner}
                            className="rounded-lg bg-red-400 px-3 py-2 text-sm text-white hover:bg-slate-800"
                        >
                            Clear Data
                        </button>
                        <button
                            onClick={fetchData}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                        >
                            {loading ? "กำลังโหลด..." : "รีเฟรช"}
                        </button>
                        <button
                            onClick={exportCsv}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                        >
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="p-4 tabulator-glass" >
                    <ReactTabulatorNoSSR
                        forwardedRef={tableRef}
                        data={listWinners}
                        columns={columns}
                        options={options}
                        events={{ tableBuilt: onTableBuilt }}
                    />
                </div>
            </div>
        </div>
    );
}
