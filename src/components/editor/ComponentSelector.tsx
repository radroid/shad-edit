import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function ComponentSelector() {
  return (
    <div className="space-y-4">
      <Input placeholder="Search components..." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4">Component {i}</Card>
        ))}
      </div>
    </div>
  )
}


