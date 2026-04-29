import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { GeneratedPrompt } from "@/lib/prompts/generate"

const STAGE_COLORS: Record<string, string> = {
  awareness: "bg-blue-100 text-blue-700 border-blue-200",
  consideration: "bg-purple-100 text-purple-700 border-purple-200",
  decision: "bg-green-100 text-green-700 border-green-200",
  problem: "bg-orange-100 text-orange-700 border-orange-200",
  solution: "bg-teal-100 text-teal-700 border-teal-200",
}

type Props = { prompt: GeneratedPrompt }

export function PromptCard({ prompt }: Props) {
  return (
    <Card className="text-sm">
      <CardContent className="flex flex-col gap-2 pt-4">
        <Badge
          variant="outline"
          className={STAGE_COLORS[prompt.stage] ?? "bg-gray-100 text-gray-700 border-gray-200"}
        >
          {prompt.stage}
        </Badge>
        <p className="text-muted-foreground leading-relaxed">{prompt.text}</p>
      </CardContent>
    </Card>
  )
}
