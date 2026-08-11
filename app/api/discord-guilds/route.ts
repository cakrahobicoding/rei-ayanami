import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

const MANAGE_GUILD = 0x20n
const VPS_API_BASE = process.env.VPS_API_BASE!
const API_KEY = process.env.DASHBOARD_API_KEY!

export async function GET() {
  const session: any = await getServerSession(authOptions as any)
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 })
  }

  const userGuildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  })
  if (!userGuildsRes.ok) {
    return NextResponse.json({ error: "Gagal ambil data dari Discord" }, { status: 502 })
  }
  const userGuilds: { id: string; permissions: string }[] = await userGuildsRes.json()
  const manageableIds = new Set(
    userGuilds
      .filter((g) => (BigInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD)
      .map((g) => g.id)
  )

  const botGuildsRes = await fetch(`${VPS_API_BASE}/api/guilds`, {
    headers: { "x-api-key": API_KEY },
  })
  if (!botGuildsRes.ok) {
    return NextResponse.json({ error: "Gagal hubungi API bot" }, { status: 502 })
  }
  const botGuilds: { id: string; name: string; icon: string | null; memberCount: number }[] =
    await botGuildsRes.json()

  const result = botGuilds.filter((g) => manageableIds.has(g.id))
  return NextR
