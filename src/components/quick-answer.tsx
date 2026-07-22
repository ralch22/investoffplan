interface QuickAnswerProps {
  answer: string
  className?: string
}

/**
 * Answer-first callout block for AI citation surfaces (ChatGPT, Perplexity, Gemini).
 * Renders a stable, visible, server-rendered paragraph near the top of key pages.
 * The `id="quick-answer"` is a stable anchor for potential speakable markup.
 */
export function QuickAnswer({ answer, className }: QuickAnswerProps) {
  return (
    <div
      id="quick-answer"
      className={`border-l-4 border-brand bg-brand-muted px-4 py-3 my-4 rounded-r text-sm text-text-dark leading-relaxed ${className ?? ""}`}
    >
      <p>{answer}</p>
    </div>
  )
}
