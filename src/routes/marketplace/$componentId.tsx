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
  
  const handleEdit = () => {
    // Navigate directly without closing the dialog
    // The navigation will unmount this component cleanly
    navigate({
      to: '/marketplace/$componentId/edit',
      params: { componentId },
    })
  }
  
  return (
    <ComponentOverlay
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) navigate({ to: '/marketplace' })
      }}
      componentId={componentId}
      onEdit={handleEdit}
    />
  )
}



