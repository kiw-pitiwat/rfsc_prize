import { NextResponse } from "next/server";
import { pool } from "../../src/lib/mysql";
import { USERITEM } from "@/app/types";
export const runtime = "nodejs"; // ให้ชัดว่าใช้ Node runtime (ไม่ใช่ edge)


export async function POST(req: Request) {
    let body: unknown;

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
    }

    if (!Array.isArray(body)) {
        return NextResponse.json({ ok: false, message: "Body must be array" }, { status: 400 });
    }

    // แปลง/ตรวจแบบง่าย ๆ
    const items: USERITEM[] = body.map((x: USERITEM) => ({
        MEMBER_NO: Number(x.MEMBER_NO),
        MEMBER_NAME: String(x.MEMBER_NAME ?? ""),
        GROUP_NAME: String(x.GROUP_NAME ?? ""),
        DEPARTMENT: String(x.DEPARTMENT ?? ""),
        AFFILIATION: String(x.AFFILIATION ?? ""),
        prize_id: x.prize_id !== null && x.prize_id !== undefined ? Number(x.prize_id) : null,
        prize_name: x.prize_name !== null && x.prize_name !== undefined ? String(x.prize_name) : null,
    }));

    // ตรวจขั้นต่ำ (กัน null/NaN)
    for (const it of items) {
        if (!Number.isFinite(it.MEMBER_NO) || it.MEMBER_NAME.trim() === "") {
            return NextResponse.json(
                { ok: false, message: "Invalid MEMBER_NO or MEMBER_NAME" },
                { status: 400 }
            );
        }
    }

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const sql = `
      INSERT INTO prize_winners
        (MEMBER_NO,MEMBER_NAME,PRIZE_ID,PRIZE_NAME,ENTRY_DATE)
      VALUES (?,?,?,?, NOW())
    `;
        for (const it of items) {
            await conn.execute(sql, [
                it.MEMBER_NO,
                it.MEMBER_NAME,
                it.prize_id,
                it.prize_name
            ]);
        }
        await conn.commit();
        return NextResponse.json({ ok: true, inserted: items.length });
    } catch (err: unknown) {
        await conn.rollback();
        const msg = err instanceof Error ? err.message : "Insert failed";
        return NextResponse.json({ ok: false, message: msg }, { status: 500 });
    } finally {
        conn.release();
    }
}