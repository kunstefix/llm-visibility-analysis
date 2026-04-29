import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { GeneratedPrompt } from "@/lib/prompts/generate"

const STAGE_COLORS: Record<string, string> = {
  awareness: "bg-blue-100 text-blue-800",
  consideration: "bg-purple-100 text-purple-800",
  decision: "bg-green-100 text-green-800",
  problem: "bg-orange-100 text-orange-800",
  solution: "bg-teal-100 text-teal-800",
}

type Props = { prompt: GeneratedPrompt }

export function PromptCard({ prompt }: Props) {
  return (
    <Card className="text-sm">
      <CardContent className="flex flex-col gap-2 pt-4">
        <Badge
          className={
            STAGE_COLORS[prompt.stage] ?? "bg-gray-100 text-gray-800"
          }
          variant="outline"
        >
          {prompt.stage}
        </Badge>
        <p className="text-muted-foreground leading-relaxed">{prompt.text}</p>
      </CardContent>
    </Card>
  )
}
