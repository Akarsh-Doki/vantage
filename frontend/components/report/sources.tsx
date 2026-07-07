import { ArrowUpRight } from "lucide-react"
import type { Source } from "@/lib/report-types"
import { SectionHeading } from "./section-heading"

export function Sources({ sources }: { sources: Source[] }) {
  return (
    <div id="sources">
      <SectionHeading
        eyebrow="Appendix"
        title="Sources"
        lede="Every citation number above points to one of these."
      />
      <ol className="divide-y divide-hairline rounded-[10px] border border-hairline bg-white">
        {sources.map((s, i) => (
          <li key={s.url ?? s.title} id={`source-${String(i + 1)}`} className="scroll-mt-24">
            <a
              href={s.url ?? "#"}
              {...(s.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/40"
            >
              <span className="font-mono text-sm font-semibold text-forest">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block break-words font-medium leading-snug">{s.title}</span>
                {s.host ? <span className="block font-mono text-xs text-muted-foreground">{s.host}</span> : null}
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-forest" />
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}
