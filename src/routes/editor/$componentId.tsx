import { createFileRoute } from '@tanstack/react-router'
import ComponentSelector from '@/components/editor/ComponentSelector'
import ComponentPreview from '@/components/editor/ComponentPreview'
import StyleEditor from '@/components/editor/StyleEditor'

export const Route = createFileRoute('/editor/$componentId')({
  component: EditorPage,
})

function EditorPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
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


