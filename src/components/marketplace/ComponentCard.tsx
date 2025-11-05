import { Card } from '@/components/ui/card'

export default function ComponentCard({ title, onClick }: { title: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="p-4 hover:border-cyan-500/50 transition-colors cursor-pointer">
        <div className="h-24 rounded bg-slate-800/50 mb-3" />
        <div className="text-sm text-slate-200 font-medium">{title}</div>
      </Card>
    </button>
  )
}



