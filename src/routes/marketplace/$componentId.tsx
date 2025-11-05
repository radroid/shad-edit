import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import ComponentOverlay from '@/components/marketplace/ComponentOverlay'

export const Route = createFileRoute('/marketplace/$componentId')({
  component: OverlayPage,
})

function OverlayPage() {
  const { componentId } = useParams({ strict: false }) as { componentId: string }
  const [open, setOpen] = useState(true)
  return <ComponentOverlay open={open} onOpenChange={setOpen} />
}


