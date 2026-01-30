import { NextResponse } from "next/server";
import { pool } from "../../src/lib/mysql";
export const runtime = "nodejs"; // ให้ชัดว่าใช้ Node runtime (ไม่ใช่ edge)

export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM eligible_participants where member_no not in (select member_no from prize_winners) `
        );

        return NextResponse.json(
            { ok: true, data: rows },
            { status: 200 }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, error: "DB_ERROR" },
            { status: 500 }
        );
    }
}