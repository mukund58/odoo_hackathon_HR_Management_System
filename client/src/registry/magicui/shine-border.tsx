// ShineBorder removed — simple passthrough stub to preserve imports.
import * as React from 'react'

type ShineBorderProps = React.HTMLAttributes<HTMLDivElement>

export function ShineBorder({ children, className, ...props }: ShineBorderProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}
