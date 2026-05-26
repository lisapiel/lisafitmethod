"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import CourseHeader from "@/components/training/CourseHeader"
import CourseSidebar from "@/components/training/CourseSidebar"
import { CourseProgressProvider } from "@/components/training/CourseProgressContext"

export default function TrainingFoundationsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Reset scroll position when navigating to a new page
  useEffect(() => {
    const el = document.querySelector(".course-scroll-area")
    if (el) el.scrollTop = 0
  }, [pathname])

  return (
    <CourseProgressProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          overflow: "hidden",
          background: "#0a0a0a",
          color: "#f0e6d3",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontWeight: 300,
          lineHeight: 1.35,
        }}
      >
        <CourseHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <CourseSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              scrollbarWidth: "thin",
            }}
            className="course-scroll-area"
          >
            <style>{`
              .course-scroll-area::-webkit-scrollbar { width: 4px; }
              .course-scroll-area::-webkit-scrollbar-thumb { background: #2a2a2a; }
              .course-scroll-area [id] { scroll-margin-top: 1rem; }
              @media (max-width: 768px) {
                .course-scroll-area { padding-top: 3.5rem; }
                .course-scroll-area [id] { scroll-margin-top: 4.5rem; }
              }
            `}</style>
            {children}
          </div>
        </div>
      </div>
    </CourseProgressProvider>
  )
}
