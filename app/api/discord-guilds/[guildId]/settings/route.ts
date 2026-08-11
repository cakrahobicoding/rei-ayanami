import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

const VPS_API_BASE = process.env.VPS_API_BASE!
const API_KEY = process.env.DASHBOARD_API_KEY!

export async function GET(
  req: Request,
  { params }: { params: { guildId: string } }
) {
  const session: any = await getServerSession(authOptions as any)
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 })
  }

  const res = await fetch(`${VPS_API_BASE}/api/guilds/${params.guildId}/settings`, {
    headers: { "x-api-key": API_KEY },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(
  req: Request,
  { params }: { params: { guildId: string } }
) {
  const session: any = await getServerSession(authOptions as any)
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 })
  }

  const body = await req.json()
  const res = await fetch(`${VPS_API_BASE}/api/guilds/${params.guildId}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
