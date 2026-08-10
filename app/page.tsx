"use client"

import { useEffect, useState, useCallback } from "react"
import { signIn, signOut, useSession } from "next-auth/react"

type PageName = "home" | "settings" | "donate"
type Guild = { id: string; name: string; icon: string | null; memberCount: number }
type Channel = { id: string; name: string }
type WelcomeConfig = {
  guild_id: string
  welcome_channel_id: string | null
  welcome_message: string | null
  welcome_title: string
  welcome_footer: string
  welcome_color: string
  welcome_image: string | null
}

export default function Home() {
  const { data: session, status } = useSession()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState<PageName>("home")
  const [clock, setClock] = useState("00.00.00")

  const [guilds, setGuilds] = useState<Guild[]>([])
  const [guildsLoading, setGuildsLoading] = useState(true)
  const [guildsError, setGuildsError] = useState("")
  const [activeGuildId, setActiveGuildId] = useState<string | null>(null)

  const [channels, setChannels] = useState<Channel[]>([])
  const [channelsLoading, setChannelsLoading] = useState(false)

  const [config, setConfig] = useState<WelcomeConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0")
    const tick = () => {
      const now = new Date()
      setClock(`${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const fetchGuilds = useCallback(async () => {
    if (!session) return
    setGuildsLoading(true)
    setGuildsError("")
    try {
      const res = await fetch("/api/discord-guilds")
      if (!res.ok) throw new Error()
      const data: Guild[] = await res.json()
      setGuilds(data)
      if (data.length > 0) setActiveGuildId((prev) => prev ?? data[0].id)
    } catch {
      setGuildsError("Gagal ambil daftar server. Coba refresh, atau cek API VPS-nya nyala.")
    } finally {
      setGuildsLoading(false)
    }
  }, [session])

  useEffect(() => { fetchGuilds() }, [fetchGuilds])

  useEffect(() => {
    if (!activeGuildId) return

    setChannelsLoading(true)
    fetch(`/api/discord-guilds/${activeGuildId}/channels`)
      .then((r) => r.json())
      .then(setChannels)
      .catch(() => setChannels([]))
      .finally(() => setChannelsLoading(false))

    setConfigLoading(true)
    fetch(`/api/discord-guilds/${activeGuildId}/settings`)
      .then((r) => r.json())
      .then((data) =>
        setConfig({
          guild_id: activeGuildId,
          welcome_channel_id: data.welcome_channel_id ?? null,
          welcome_message: data.welcome_message ?? "Selamat datang {member} di {server}! 🎉\nKamu adalah member ke-{membercount}",
          welcome_title: data.welcome_title ?? "👋 Selamat Datang di Server!",
          welcome_footer: data.welcome_footer ?? "Selamat bergabung!",
          welcome_color: data.welcome_color ?? "#8FE3B0",
          welcome_image: data.welcome_image ?? null,
        })
      )
      .catch(() => setConfig(null))
      .finally(() => setConfigLoading(false))
  }, [activeGuildId])

  async function handleSave() {
    if (!activeGuildId || !config) return
    setSaveState("saving")
    try {
      const res = await fetch(`/api/discord-guilds/${activeGuildId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcome_channel_id: config.welcome_channel_id,
          welcome_message: config.welcome_message,
          welcome_title: config.welcome_title,
          welcome_footer: config.welcome_footer,
          welcome_color: config.welcome_color,
          welcome_image: config.welcome_image,
        }),
      })
      if (!res.ok) throw new Error()
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch {
      setSaveState("error")
    }
  }

  function goToPage(name: PageName) {
    setActivePage(name)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function updateConfig<K extends keyof WelcomeConfig>(key: K, value: WelcomeConfig[K]) {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const activeGuild = guilds.find((g) => g.id === activeGuildId)
  const previewDesc = (config?.welcome_message ?? "")
    .replace("{member}", "@kamu")
    .replace("{server}", activeGuild?.name ?? "server")
    .replace("{membercount}", String(activeGuild?.memberCount ?? "?"))

  if (status === "loading") {
    return (
      <div className="login-wrap">
        <p style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>Memuat…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="brand-badge">Rei <span className="tag">API</span></div>
          <p>Masuk dengan akun Discord untuk mengakses dashboard Rei Ayanami.</p>
          <button className="btn btn-discord" onClick={() => signIn("discord")}>
            Login with Discord
          </button>
        </div>
      </div>
    )
  }

  const displayName = session.user?.name ?? "Admin"

  return (
    <>
      <div className="topbar">
        <button className="burger" aria-label="Buka menu" onClick={() => setSidebarOpen(true)}>☰</button>
        <div className="brand-badge">Rei <span className="tag">API</span></div>
      </div>

      <div className={`overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-head">
            <div className="brand-badge">Rei <span className="tag">API</span></div>
            <button className="burger close-btn" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <div className="nav-group-label">Main</div>
          <button className={`nav-item ${activePage === "home" ? "active" : ""}`} onClick={() => goToPage("home")}>
            <span className="ic">⌂</span> Dashboard
          </button>
          <button className={`nav-item ${activePage === "settings" ? "active" : ""}`} onClick={() => goToPage("settings")}>
            <span className="ic">⚙</span> Setting Welcome
          </button>
          <button className={`nav-item ${activePage === "donate" ? "active" : ""}`} onClick={() => goToPage("donate")}>
            <span className="ic">♥</span> Donasi
          </button>

          <div className="nav-group-label">Akun</div>
          <button className="nav-item" onClick={() => signOut()}><span className="ic">⎋</span> Logout</button>
        </aside>

        <main className="content">
          <section className={`page ${activePage === "home" ? "active" : ""}`}>
            <span className="status-pill"><span className="blip"></span> BOT ONLINE</span>
            <h1 className="greeting">Halo, {displayName}</h1>
            <p className="lead">Panel kontrol Rei Ayanami. Pantau member, atur welcome message, dan kelola server dari sini.</p>

            <div className="time-card">
              <div className="lbl">Local Time</div>
              <div className="val">{clock}</div>
            </div>

            {guildsError && (
              <div className="card" style={{ borderColor: "#c0392b" }}>
                <p style={{ color: "#c0392b", fontSize: "0.85rem" }}>{guildsError}</p>
              </div>
            )}

            {guildsLoading ? (
              <p style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.85rem" }}>
                Mengambil daftar server…
              </p>
            ) : guilds.length === 0 ? (
              <div className="card">
                <p style={{ fontSize: "0.88rem" }}>
                  Belum ada server yang cocok. Pastikan bot Rei Ayanami sudah di-invite ke
                  server Discord kamu dan kamu punya izin <b>Manage Server</b> di sana.
                </p>
              </div>
            ) : (
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="chip yellow">🗂</div>
                  <div className="lbl">Total Server Terkelola</div>
                  <div className="num">{guilds.length}</div>
                  <span className="tag-pill up">Kamu punya akses</span>
                </div>
                <div className="stat-card">
                  <div className="chip green">👥</div>
                  <div className="lbl">{activeGuild?.name ?? "Server aktif"}</div>
                  <div className="num">{activeGuild?.memberCount ?? "-"}</div>
                  <span className="tag-pill">Total member</span>
                </div>
              </div>
            )}

            <div className="cta-row">
              <button className="btn btn-ghost" onClick={() => goToPage("settings")}>Buka Setting</button>
            </div>
          </section>

          <section className={`page ${activePage === "settings" ? "active" : ""}`}>
            <h2 className="page-title">Setting Welcome</h2>
            <p className="page-sub">Config disimpan langsung ke database bot. Perubahan berlaku setelah klik Simpan.</p>

            <div className="card">
              <div className="lbl">Pilih Server</div>
              {guildsLoading && <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Memuat…</p>}
              {guilds.map((g) => (
                <button
                  key={g.id}
                  className={`server-item ${activeGuildId === g.id ? "active" : ""}`}
                  onClick={() => setActiveGuildId(g.id)}
                >
                  <span className="box"></span> {g.name}
                </button>
              ))}
            </div>

            {!activeGuildId ? (
              <div className="card"><p style={{ fontSize: "0.88rem" }}>Pilih server dulu di atas.</p></div>
            ) : configLoading || !config ? (
              <div className="card"><p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Memuat konfigurasi…</p></div>
            ) : (
              <>
                <div className="card">
                  <div className="lbl">Konfigurasi</div>

                  <div className="field">
                    <label htmlFor="channel">Channel tujuan</label>
                    {channelsLoading ? (
                      <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Memuat channel…</p>
                    ) : (
                      <select
                        id="channel"
                        value={config.welcome_channel_id ?? ""}
                        onChange={(e) => updateConfig("welcome_channel_id", e.target.value)}
                      >
                        <option value="">— pilih channel —</option>
                        {channels.map((c) => (
                          <option key={c.id} value={c.id}>#{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="title">Judul embed</label>
                    <input
                      type="text" id="title" value={config.welcome_title}
                      onChange={(e) => updateConfig("welcome_title", e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="msg">Isi pesan</label>
                    <textarea
                      id="msg" rows={4} value={config.welcome_message ?? ""}
                      onChange={(e) => updateConfig("welcome_message", e.target.value)}
                    />
                    <div className="variables">
                      <span>{"{member}"}</span>
                      <span>{"{server}"}</span>
                      <span>{"{membercount}"}</span>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="img">URL gambar (opsional)</label>
                    <input
                      type="text" id="img" placeholder="https://..."
                      value={config.welcome_image ?? ""}
                      onChange={(e) => updateConfig("welcome_image", e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>Warna embed</label>
                    <div className="color-row">
                      <input
                        type="color" value={config.welcome_color}
                        onChange={(e) => updateConfig("welcome_color", e.target.value)}
                      />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--muted)" }}>
                        {config.welcome_color}
                      </span>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="footer">Footer</label>
                    <input
                      type="text" id="footer" value={config.welcome_footer}
                      onChange={(e) => updateConfig("welcome_footer", e.target.value)}
                    />
                  </div>

                  <div className="cta-row">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saveState === "saving"}>
                      {saveState === "saving" ? "Menyimpan…" : "Simpan"}
                    </button>
                    {saveState === "saved" && <span className="tag-pill up">Tersimpan ✓</span>}
                    {saveState === "error" && <span style={{ color: "#c0392b", fontSize: "0.82rem" }}>Gagal menyimpan</span>}
                  </div>
                </div>

                <div className="card">
                  <div className="lbl">Preview</div>
                  <div className="embed-preview" style={{ borderLeftColor: config.welcome_color }}>
                    <div className="e-title">{config.welcome_title || "👋 Selamat Datang!"}</div>
                    <div className="e-desc">{previewDesc}</div>
                    <div className="e-footer">{config.welcome_footer}</div>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className={`page ${activePage === "donate" ? "active" : ""}`}>
            <h2 className="page-title">Dukung Rei Ayanami</h2>
            <p className="page-sub">Agar Terus online tiap hari nya 🙈</p>
            <div className="platform-row">
              <a href="https://saweria.co/ellenjoe" className="platform-btn">Saweria</a>
            </div>
          </section>
        </main>
      </div>
    </>
  )
        }
