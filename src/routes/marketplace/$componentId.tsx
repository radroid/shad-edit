import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import ComponentOverlay from '@/components/marketplace/ComponentOverlay'

export const Route = createFileRoute('/marketplace/$componentId')({
  component: OverlayPage,
})

function OverlayPage() {
  const { componentId } = useParams({ strict: false }) as { componentId: string }
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  return (
    <ComponentOverlay
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) navigate({ to: '/marketplace' })
      }}
      componentId={componentId}
    />
  )
}



