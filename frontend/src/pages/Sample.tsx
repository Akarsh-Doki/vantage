import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/*
 * Public, read-only showcase of a finished report. The live sample generator
 * (POST /sample) requires an account, so this page shows representative,
 * illustrative content — no backend call — to keep the route truly public.
 */
const strategy = [
  {
    title: 'Positioning',
    body: 'Own “third-wave coffee, neighborhood prices.” Competitors read as either cheap-and-fast or premium-and-aloof; the gap is craft that still feels local.',
  },
  {
    title: 'Primary channel',
    body: 'Instagram + Google Business Profile. 78% of nearby discovery for cafés starts in Maps; reviews and photos move the needle more than paid social at this budget.',
  },
  {
    title: 'First campaign',
    body: 'A four-week “Meet the Roaster” series: one origin story per week, each tied to a limited single-origin pour and a reorder prompt for bagged beans.',
  },
]

const sources = [
  'census.gov/quickfacts — household income for the trade area',
  'support.google.com/business — Maps discovery share for local cafés',
  'yelp.com — recurring themes in competitor reviews',
]

export default function Sample() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="reading-column flex items-center justify-between py-6">
        <Link to="/" className="font-serif text-lg font-semibold tracking-tight">
          Vantage
        </Link>
        <Button asChild size="sm">
          <Link to="/login">Start your own</Link>
        </Button>
      </div>

      <div className="reading-column space-y-section py-20">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Sample report</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
            Rivertown Coffee Roasters
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            A preview of a full Vantage campaign. Every recommendation links back to a cited source.
          </p>
        </header>

        <section className="space-y-4">
          {strategy.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed text-foreground">
                  {item.body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Sources</p>
          <ul className="mt-4 space-y-2">
            {sources.map((source) => (
              <li key={source} className="font-mono text-sm text-muted-foreground">
                {source}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-border pt-10">
          <p className="text-lg text-foreground">Want one for your business?</p>
          <Button asChild className="mt-4">
            <Link to="/login">Generate your campaign</Link>
          </Button>
        </section>
      </div>
    </main>
  )
}
