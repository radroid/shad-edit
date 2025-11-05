import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function StyleEditor() {
  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-medium">Spacing</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Padding" />
          <Input placeholder="Margin" />
        </div>
      </Card>
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-medium">Typography</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Font size" />
          <Input placeholder="Weight" />
        </div>
      </Card>
    </div>
  )
}



