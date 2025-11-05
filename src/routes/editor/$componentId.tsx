import { createFileRoute } from '@tanstack/react-router'
import ComponentSelector from '@/components/editor/ComponentSelector'
import ComponentPreview from '@/components/editor/ComponentPreview'
import StyleEditor from '@/components/editor/StyleEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useState } from 'react'

export const Route = createFileRoute('/editor/$componentId')({
  component: EditorPage,
})

function EditorPage() {
  const [name, setName] = useState('Untitled Component')
  const [description, setDescription] = useState('')
  const [customizations, setCustomizations] = useState<Record<string, unknown>>({})
  const saveComponent = useMutation(api.components.saveComponent)
  const publishComponent = useMutation(api.components.publishComponent)

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
      <div className="md:col-span-12 flex items-center gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <Button
          onClick={async () => {
            await saveComponent({ name, description, customizations })
          }}
        >
          Save Draft
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const id = await saveComponent({ name, description, customizations })
            await publishComponent({ componentId: id })
          }}
        >
          Publish
        </Button>
      </div>
      <div className="md:col-span-3">
        <ComponentSelector />
      </div>
      <div className="md:col-span-6">
        <ComponentPreview />
      </div>
      <div className="md:col-span-3">
        <StyleEditor />
      </div>
    </div>
  )
}



