import { NextResponse } from "next/server";
import { pool } from "../../src/lib/mysql";
export const runtime = "nodejs"; // ให้ชัดว่าใช้ Node runtime (ไม่ใช่ edge)


export async function POST(req: Request) {
   
    const conn = await pool.getConnection();

    try {
        const sql = ` truncate table prize_winners`;
        await conn.execute(sql);
        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        await conn.rollback();
        const msg = err instanceof Error ? err.message : "Insert failed";
        return NextResponse.json({ ok: false, message: msg }, { status: 500 });
    } finally {
        conn.release();
    }
}