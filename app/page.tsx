"use client"

import { useEffect, useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"

type PageName = "home" | "settings" | "donate"

const SERVERS = ["Server Utama", "Komunitas Anime", "Project Test"]

export default function Home() {
  const { data: session, status } = useSession()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState<PageName>("home")
  const [activeServer, setActiveServer] = useState(0)
  const [clock, setClock] = useState("00.00.00")

  const [title, setTitle] = useState("👋 Selamat Datang di Server!")
  const [msg, setMsg] = useState(
    "Selamat datang {member} di {server}! 🎉\nKamu adalah member ke-{membercount}"
  )
  const [footer, setFooter] = useState("Selamat bergabung!")

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

  function goToPage(name: PageName) {
    setActivePage(name)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const previewDesc = msg
    .replace("{member}", "@kamu")
    .replace("{server}", SERVERS[activeServer])
    .replace("{membercount}", "42")

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

          <div className="nav-group-label">System</div>
          <button className="nav-item"><span className="ic">▮</span> Status Bot</button>
          <button className="nav-item"><span className="ic">▤</span> Log Aktivitas</button>

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

            <div className="stat-grid">
              <div className="stat-card">
                <div className="chip yellow">👋</div>
                <div className="lbl">Member Hari Ini</div>
                <div className="num">18</div>
                <span className="tag-pill up">↑ Aktif hari ini</span>
              </div>
              <div className="stat-card">
                <div className="chip green">📈</div>
                <div className="lbl">Command Bulan Ini</div>
                <div className="num">4.512</div>
                <span className="tag-pill">Bulan ini</span>
              </div>
              <div className="stat-card">
                <div className="chip orange">🖥</div>
                <div className="lbl">Total Interaksi</div>
                <div className="num">128.930</div>
                <span className="tag-pill">Sepanjang waktu</span>
              </div>
            </div>

            <div className="cta-row">
              <a href="#" className="btn btn-primary">Invite ke Server</a>
              <button className="btn btn-ghost" onClick={() => goToPage("settings")}>Buka Setting</button>
            </div>
          </section>

          <section className={`page ${activePage === "settings" ? "active" : ""}`}>
            <h2 className="page-title">Setting Welcome</h2>
            <p className="page-sub">Config diambil dari <code>welcomeStore.js</code> — channel, teks, gambar, warna & footer embed per server.</p>

            <div className="card">
              <div className="lbl">Pilih Server</div>
              {SERVERS.map((s, i) => (
                <button
                  key={s}
                  className={`server-item ${activeServer === i ? "active" : ""}`}
                  onClick={() => setActiveServer(i)}
                >
                  <span className="box"></span> {s}
                </button>
              ))}
            </div>

            <div className="card">
              <div className="lbl">Konfigurasi</div>

              <div className="field">
                <label htmlFor="channel">Channel tujuan</label>
                <select id="channel">
                  <option>#welcome</option>
                  <option>#general</option>
                  <option>#announcements</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="title">Judul embed</label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="msg">Isi pesan</label>
                <textarea id="msg" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} />
                <div className="variables">
                  <span>{"{member}"}</span>
                  <span>{"{server}"}</span>
                  <span>{"{membercount}"}</span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="img">URL gambar (opsional)</label>
                <input type="text" id="img" placeholder="https://..." />
              </div>

              <div className="field">
                <label>Warna embed</label>
                <div className="color-row">
                  <input type="color" defaultValue="#8FE3B0" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--muted)" }}>#8FE3B0</span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="footer">Footer</label>
                <input type="text" id="footer" value={footer} onChange={(e) => setFooter(e.target.value)} />
              </div>

              <div className="cta-row"><button className="btn btn-primary">Simpan</button></div>
              <p className="stub-note">// GET/POST https://api.ranzxhosting.biz.id/api/servers/:guildId/welcome</p>
            </div>

            <div className="card">
              <div className="lbl">Preview</div>
              <div className="embed-preview">
                <div className="e-title">{title || "👋 Selamat Datang!"}</div>
                <div className="e-desc">{previewDesc}</div>
                <div className="e-footer">{footer}</div>
              </div>
            </div>
          </section>

          <section className={`page ${activePage === "donate" ? "active" : ""}`}>
            <h2 className="page-title">Dukung Rei Ayanami</h2>
            <p className="page-sub">Bot ini jalan 24/7 di VPS pribadi. Dukungan kecil bikin bot tetap online dan terus dikembangkan.</p>

            <div className="donate-grid">
              <div className="card donate-card">
                <span className="tier">Suporter</span>
                <h3>Traktir Kopi</h3>
                <p>Dukungan untuk developer</p>
                <a href="https://saweria.co/ellenjoe" className="btn btn-ghost">Kirim Dukungan</a>
              </div>
              <div className="card donate-card">
                <span className="tier">Sultan</span>
                <h3>Bantu Biaya owner makan</h3>
                <p>Bantu buat owner terus semangat</p>
                <a href="https://saweria.co/ellenjoe" className="btn btn-primary">Kirim Dukungan</a>
              </div>
              <div className="card donate-card">
                <span className="tier">Juragan</span>
                <h3>Request Fitur</h3>
                <p>Dukungan lebih besar + prioritas request fitur baru buat server kamu.</p>
                <a href="https://saweria.co/ellenjoe" className="btn btn-ghost">Kirim Dukungan</a>
              </div>
            </div>

            <div className="platform-row">
              <a href="https://saweria.co/ellenjoe" className="platform-btn">Saweria</a>
              <a href="#" className="platform-btn">Trakteer</a>
              <a href="#" className="platform-btn">QRIS</a>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}
