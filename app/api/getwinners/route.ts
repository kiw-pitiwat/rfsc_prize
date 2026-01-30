import { NextResponse } from "next/server";
import { pool } from "../../src/lib/mysql";
export const runtime = "nodejs"; // ให้ชัดว่าใช้ Node runtime (ไม่ใช่ edge)

export async function GET() {
    try {
        const [rows] = await pool.query(
            `select ROW_NUMBER() OVER (ORDER BY ENTRY_DATE) AS row_num,
MEMBER_NO,MEMBER_NAME,PRIZE_NAME,ENTRY_DATE
from prize_winners order by entry_date asc `
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