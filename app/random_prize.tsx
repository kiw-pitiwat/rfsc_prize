"use client";

import { useState } from "react";
import { motion } from "framer-motion";

function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default function HomePage() {
    const [namesText, setNamesText] = useState(
        "สมชาย\nสมหญิง\nอนันต์\nมยุรา\nกิตติ\nวราภรณ์"
    );
    const [winnerCount, setWinnerCount] = useState(3);
    const [winners, setWinners] = useState<string[]>([]);
    const [error, setError] = useState("");

    const handleDraw = () => {
        setError("");
        setWinners([]);

        const names = namesText
            .split("\n")
            .map((n) => n.trim())
            .filter((n) => n !== "");

        if (names.length === 0) {
            setError("กรุณากรอกรายชื่อผู้มีสิทธิ์อย่างน้อย 1 คน");
            return;
        }

        if (winnerCount < 1) {
            setError("จำนวนผู้ได้รับรางวัล ต้องมากกว่า 0");
            return;
        }

        if (winnerCount > names.length) {
            setError("จำนวนผู้ได้รับรางวัล มากกว่าจำนวนรายชื่อที่มีอยู่");
            return;
        }

        const shuffled = shuffleArray(names);
        const selected = shuffled.slice(0, winnerCount);
        setWinners(selected);
    };

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background:
                    "radial-gradient(circle at top, #e0f2fe 0, #f4f4f5 40%, #e5e7eb 100%)",
                padding: "16px",
            }}
        >
            <div
                style={{
                    maxWidth: "800px",
                    width: "100%",
                    background: "white",
                    borderRadius: "24px",
                    padding: "24px",
                    boxShadow: "0 18px 45px rgba(15,23,42,0.16)",
                    border: "1px solid #e5e7eb",
                }}
            >
                <header style={{ textAlign: "center", marginBottom: "20px" }}>
                    <motion.h1
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 16 }}
                        style={{
                            fontSize: "26px",
                            fontWeight: 800,
                        }}
                    >
                        🎁 โปรแกรมสุ่มรายชื่อผู้ได้รับรางวัล
                    </motion.h1>
                    <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px" }}>
                        กำหนดรายชื่อเองได้ · เลือกจำนวนผู้โชคดีได้ · การ์ดดุ๊กดิ๊กสวย ๆ ตอนสุ่ม
                    </p>
                </header>

                {/* ส่วนตั้งค่ารายชื่อ + จำนวน */}
                <section
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
                        gap: "16px",
                        marginBottom: "16px",
                    }}
                >
                    <div>
                        <label
                            style={{ fontWeight: 600, fontSize: "14px", display: "block" }}
                        >
                            รายชื่อผู้มีสิทธิ์สุ่มรางวัล
                        </label>
                        <p
                            style={{
                                fontSize: "12px",
                                color: "#9ca3af",
                                marginBottom: "4px",
                            }}
                        >
                            กรอกรายชื่อทีละคน บรรทัดละ 1 คน
                        </p>
                        <textarea
                            rows={10}
                            style={{
                                width: "100%",
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb",
                                padding: "10px",
                                fontSize: "14px",
                                resize: "vertical",
                                outline: "none",
                            }}
                            value={namesText}
                            onChange={(e) => setNamesText(e.target.value)}
                            placeholder={"เช่น\nสมชาย\nสมหญิง\nอนันต์\nมยุรา\n..."}
                        />
                    </div>

                    <div>
                        <label
                            style={{ fontWeight: 600, fontSize: "14px", display: "block" }}
                        >
                            จำนวนผู้ได้รับรางวัล
                        </label>
                        <p
                            style={{
                                fontSize: "12px",
                                color: "#9ca3af",
                                marginBottom: "4px",
                            }}
                        >
                            จะให้สุ่มครั้งละกี่คน (ต้องไม่เกินจำนวนรายชื่อ)
                        </p>
                        <input
                            type="number"
                            min={1}
                            style={{
                                width: "100%",
                                borderRadius: "999px",
                                border: "1px solid #e5e7eb",
                                padding: "8px 14px",
                                fontSize: "14px",
                                marginBottom: "12px",
                            }}
                            value={winnerCount}
                            onChange={(e) => setWinnerCount(Number(e.target.value))}
                        />

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    color: "#b91c1c",
                                    background: "#fef2f2",
                                    borderRadius: "8px",
                                    padding: "6px 8px",
                                    border: "1px solid #fecaca",
                                }}
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97, y: 0 }}
                            onClick={handleDraw}
                            style={{
                                width: "100%",
                                background:
                                    "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
                                color: "white",
                                padding: "10px 16px",
                                borderRadius: "999px",
                                border: "none",
                                fontWeight: 700,
                                fontSize: "15px",
                                cursor: "pointer",
                                boxShadow: "0 10px 25px rgba(34,197,94,0.35)",
                            }}
                        >
                            🎲 สุ่มรายชื่อผู้ได้รับรางวัล
                        </motion.button>

                        <p
                            style={{
                                fontSize: "12px",
                                color: "#9ca3af",
                                marginTop: "8px",
                            }}
                        >
                            ระบบจะสุ่มแบบไม่ซ้ำ และแสดงผลในรูปแบบการ์ดดุ๊กดิ๊กด้านล่าง
                        </p>
                    </div>
                </section>

                {/* แสดงผู้ได้รับรางวัล */}
                <section>
                    <h2
                        style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        🎉 ผู้ได้รับรางวัล
                        {winners.length > 0 && (
                            <span
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "#16a34a",
                                    background: "#dcfce7",
                                    borderRadius: "999px",
                                    padding: "2px 10px",
                                }}
                            >
                                {winners.length} คน
                            </span>
                        )}
                    </h2>

                    {winners.length === 0 && (
                        <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                            ยังไม่มีผลการสุ่ม แสดงผล — กรุณากดปุ่ม “สุ่มรายชื่อผู้ได้รับรางวัล”
                        </p>
                    )}

                    {winners.length > 0 && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                                gap: "12px",
                                marginTop: "8px",
                            }}
                        >
                            {winners.map((name, index) => (
                                <motion.div
                                    key={name + index}
                                    initial={{ opacity: 0, scale: 0.5, y: 20, rotate: -8 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                        rotate: 0,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: index * 0.08,
                                    }}
                                    whileHover={{
                                        y: -4,
                                        scale: 1.03,
                                        boxShadow: "0 12px 25px rgba(15,23,42,0.16)",
                                    }}
                                    style={{
                                        background:
                                            "radial-gradient(circle at top left, #bbf7d0, #ecfeff 40%, #f9fafb 100%)",
                                        borderRadius: "16px",
                                        padding: "12px 12px 14px",
                                        border: "1px solid #e5e7eb",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* badge มุมการ์ด */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 8,
                                            right: 10,
                                            fontSize: "11px",
                                            background: "rgba(15,23,42,0.8)",
                                            color: "white",
                                            borderRadius: "999px",
                                            padding: "2px 8px",
                                        }}
                                    >
                                        #{index + 1}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "32px",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        🏆
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "16px",
                                            marginBottom: "2px",
                                            color: "#111827",
                                        }}
                                    >
                                        {name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        ผู้ได้รับของรางวัลจากการสุ่ม
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
