export const templates = {
  awareness: `What are the best {{brandCategory}} solutions available today? Give me an overview of the top options companies use.`,

  consideration: `I'm evaluating {{brandCategory}} tools for my team. What are the key features to look for and which vendors are worth considering? {{context}}`,

  decision: `Which {{brandCategory}} platform should I choose? Compare the leading options on pricing, integrations, and support. {{context}}`,

  problem: `We're struggling with {{context}}. What {{brandCategory}} tools or approaches do teams use to solve this?`,

  solution: `I need a {{brandCategory}} solution that can {{context}}. What do professionals recommend and why?`,
} as const

export type PromptStage = keyof typeof templates
