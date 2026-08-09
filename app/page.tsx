"use client"
import { signIn, signOut, useSession } from "next-auth/react"

export default function Home() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div style={{ padding: 20 }}>
        <p>Login sebagai: {session.user?.name}</p>
        <button onClick={() => signOut()}>Logout</button>
      </div>
    )
  }
  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => signIn("discord")}>Login with Discord</button>
    </div>
  )
}
