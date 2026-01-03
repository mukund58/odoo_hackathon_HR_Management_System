import React from "react"

interface MagicCardProps {
  children?: React.ReactNode
  className?: string
}

// Minimal stub replacement for MagicCard — preserves layout without effects.
export function MagicCard({ children, className }: MagicCardProps) {
  return <div className={className}>{children}</div>
}
