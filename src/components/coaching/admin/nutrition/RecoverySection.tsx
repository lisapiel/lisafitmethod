"use client"

import { useCallback, useEffect, useId, useState } from "react"
import { Icon } from "@/components/coaching/admin/AdminUi"
import { adminJson, clientPath } from "./api"
import { RecoveryItem } from "./RecoveryItem"
import { RecoveryMessageItem } from "./RecoveryMessageItem"
import type { Recovery, RecoveryMessage } from "./types"

type Data = { messages: RecoveryMessage[]; recoveries: Recovery[] }

export function RecoverySection({ email, onLogsChanged }: { email: string; onLogsChanged: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState("")
  const panelId = useId()

  const load = useCallback(async () => {
    try {
      const res = await adminJson<Partial<Data>>(clientPath(email, "/nutrition-recovery"))
      if (res.ok && res.data) {
        setData({ messages: res.data.messages ?? [], recoveries: res.data.recoveries ?? [] })
        setError("")
      } else setError("Messages couldn't be loaded. Try again in a moment.")
    } catch {
      setError("Couldn't reach the server. Try again in a moment.")
    }
  }, [email])

  useEffect(() => { if (open && !data) load() }, [open, data, load])

  async function changed() {
    await Promise.all([load(), onLogsChanged()])
  }

  const byMessage = new Map((data?.recoveries ?? []).map((r) => [r.messageId, r]))
  const recoveries = [...(data?.recoveries ?? [])].sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))

  return (
    <section className="can-card" aria-labelledby="can-rec-h">
      <h2 id="can-rec-h" className="can-h">
        <button type="button" className="can-disclose" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
          <span>Recover old reports</span>
          <Icon name="chevron" size={18} />
        </button>
      </h2>
      <p className="can-note">For reports sent in Messages before Food existed. Only you see this.</p>
      {open && (
        <div id={panelId} style={{ marginTop: 12, display: "grid", gap: 16 }}>
          <p className="can-text">
            Read the message, then type the numbers the client reported for that day. Days that already have food logs are kept as they are, and the original message is never changed.
          </p>
          {error && (
            <div className="can-actions">
              <p className="can-err" role="alert">{error}</p>
              <button type="button" className="ca-btn" onClick={load}>Try again</button>
            </div>
          )}
          {!data && !error && <p className="can-note">Loading messages…</p>}
          {data && (
            <>
              {recoveries.length > 0 && (
                <div>
                  <h3 className="can-h3">Recovered so far</h3>
                  <ul className="can-entries" style={{ marginBottom: 0 }}>
                    {recoveries.map((r) => <RecoveryItem key={r.messageId} email={email} recovery={r} onUndone={changed} />)}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="can-h3">Client&apos;s messages, newest first</h3>
                {data.messages.length === 0 ? (
                  <p className="can-note">No messages from this client.</p>
                ) : (
                  <ul className="can-msgs">
                    {data.messages.map((m) => (
                      <RecoveryMessageItem key={m.id} email={email} message={m} recovery={byMessage.get(m.id)} onRecovered={changed} />
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
