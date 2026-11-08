const svg = (d: React.ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
export const ChevronRight = () => svg(<path d="M9 6l6 6-6 6" />)
export const ChevronDown = () => svg(<path d="M6 9l6 6 6-6" />)
export const Check = ({ size = 16 }: { size?: number }) => svg(<path d="M5 12.5l4.5 4.5L19 7.5" />, size)
export const NoteIcon = ({ size = 16 }: { size?: number }) => svg(<><path d="M6 3h9l4 4v14H6z" /><path d="M9 11h7M9 15h5" /></>, size)
export const Play = () => svg(<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none" />)
