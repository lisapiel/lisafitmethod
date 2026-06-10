import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Coaching — Lisa Fit Method",
}

export default function MyCoachingHome() {
  return <CoachingHomeClient />
}

function CoachingHomeClient() {
  return (
    <div>
      <p style={{
        fontFamily: "var(--font-dm-sans), sans-serif",
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#c8a97e",
        marginBottom: "0.5rem",
      }}>
        Welcome
      </p>
      <h1 style={{
        fontFamily: "var(--font-playfair), serif",
        fontSize: "2rem",
        fontWeight: 700,
        color: "#0a0a0a",
        marginBottom: "0.5rem",
      }}>
        Your Coaching Portal
      </h1>
      <p style={{
        fontFamily: "var(--font-dm-sans), sans-serif",
        fontSize: "0.95rem",
        color: "#6b6560",
        marginBottom: "2.5rem",
        maxWidth: 500,
      }}>
        Your program, progress, and weekly check-ins — all in one place.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1rem",
      }}>
        <ComingSoonCard title="Today's Workout" desc="Your program will appear here once assigned." />
        <ComingSoonCard title="Weekly Check-In" desc="Submit your weekly check-in when your coach is ready." />
        <ComingSoonCard title="Progress" desc="Track your measurements and photos over time." />
        <ComingSoonCard title="Messages" desc="Send a message to Lisa." />
      </div>
    </div>
  )
}

function ComingSoonCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e8e2dc",
      borderRadius: 8,
      padding: "1.5rem",
    }}>
      <h3 style={{
        fontFamily: "var(--font-playfair), serif",
        fontSize: "1.05rem",
        fontWeight: 700,
        color: "#0a0a0a",
        marginBottom: "0.5rem",
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: "var(--font-dm-sans), sans-serif",
        fontSize: "0.85rem",
        color: "#6b6560",
        lineHeight: 1.5,
      }}>
        {desc}
      </p>
    </div>
  )
}
