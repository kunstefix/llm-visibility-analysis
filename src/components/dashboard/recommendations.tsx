import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  recommendations: string[]
}

export function Recommendations({ recommendations }: Props) {
  if (recommendations.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-4">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {i + 1}
              </span>
              <span className="leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
