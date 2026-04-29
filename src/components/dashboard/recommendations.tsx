type Props = {
  recommendations: string[]
}

export function Recommendations({ recommendations }: Props) {
  if (recommendations.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Recommendations</h2>
      <ul className="flex flex-col gap-3">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {i + 1}
            </span>
            <span className="leading-relaxed">{rec}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
