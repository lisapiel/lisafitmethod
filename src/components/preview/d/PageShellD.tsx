import { StylesD } from "./StylesD"
import NavD from "./NavD.client"
import { FooterD } from "./ClosingD"

// The Direction D frame every public page sits inside: the design tokens,
// the tone-aware navigation and the footer. Pages supply only their own
// sections, which is what keeps the chrome identical across the site rather
// than re-implemented per page.
export function PageShellD({ children }: { children: React.ReactNode }) {
  return (
    <div className="pv-d">
      <StylesD />
      <NavD />
      <main>{children}</main>
      <FooterD />
    </div>
  )
}
