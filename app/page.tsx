import Link from 'next/link';
import HeroArt from '@/components/landing/HeroArt';
import Reveal from '@/components/landing/Reveal';
import { SAP_PORTAL_LABEL, SAP_PORTAL_URL } from '@/lib/links';

const RITUAL = [
  'Open the PDF.',
  'Find the subject.',
  'Count the hours.',
  'Figure out which absences were placement-related.',
  'Recalculate the percentage.',
  'Then do the same thing for the next subject.',
];

const RAPID = [
  'A company calls at 10 AM.',
  'An aptitude test runs through your lecture.',
  'An interview takes longer than it was supposed to.',
  'A GD turns into half a day.',
];

const STEPS = [
  {
    n: '01',
    title: 'Get the hour-wise Detailed Report',
    body: (
      <>
        Pull your attendance PDF from the{' '}
        <a
          href={SAP_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-primary/40 underline-offset-2 transition hover:text-primary-hover"
        >
          {SAP_PORTAL_LABEL}
        </a>
        {' '}(<span className="font-mono text-[13px] text-ink-subtle">sdc-sppap1.svkm.ac.in:50001/irj/portal</span>) — open your attendance and choose{' '}
        <span className="font-medium text-ink">Detailed Report</span>. Then drop it here; theory,
        practical, tutorial and studio slots are all read.
      </>
    ),
    icon: (
      <path d="M12 3v10m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    ),
  },
  {
    n: '02',
    title: 'Mark the placement hours',
    body: 'Select the classes you missed because of placement activities. Add the company name if you want to keep track of what each absence was for.',
    icon: <path d="m5 12 5 5L20 7" />,
  },
  {
    n: '03',
    title: 'See your adjusted attendance',
    body: 'The calculator removes those placement-related absences from the calculation and shows your adjusted estimate for every subject.',
    icon: <path d="M4 19V5m0 14h16M8 15l3-4 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

const FEATURES = [
  {
    title: 'Reads the PDF properly',
    body: 'Works with hour-wise attendance across theory, practical, tutorial and studio slots instead of making you reconstruct everything manually.',
    icon: <path d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />,
  },
  {
    title: 'Keeps your selections tied to your PDF',
    body: 'Your marked hours are associated with your specific attendance file, so you can come back to the same report without starting from zero.',
    icon: <path d="M12 2 4 6v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V6z" />,
  },
  {
    title: 'Nothing leaves your browser',
    body: 'No account. No backend. No upload. Your attendance data stays on your machine.',
    icon: <path d="M4 4h16v12H4zM8 20h8M12 16v4" />,
  },
  {
    title: 'Gives you a proper report',
    body: 'Generate an A4 report showing your adjusted percentages and an annexure with every placement hour you have marked.',
    icon: <path d="M4 5h16v14H4zM4 10h16M10 10v9" />,
  },
];

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* ---------------- nav ---------------- */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-6 px-5">
          <Link href="/" className="wordmark">
            Attendly
          </Link>
          <nav className="hidden items-center gap-6 text-[14px] text-ink-subtle sm:flex">
            <a href="#story" className="transition hover:text-ink">Why</a>
            <a href="#how" className="transition hover:text-ink">How it works</a>
            <a href="#fine-print" className="transition hover:text-ink">Fine print</a>
          </nav>
          <Link href="/calculator" className="btn-primary ml-auto">
            Calculate my attendance
          </Link>
        </div>
      </header>

      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(to right, #23252a 1px, transparent 1px), linear-gradient(to bottom, #23252a 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse 90% 60% at 50% 0%, #000 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 60% at 50% 0%, #000 30%, transparent 100%)',
          }}
        />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1fr_460px] lg:pb-28 lg:pt-24">
          <div>
            <Reveal>
              <h1 className="t-display-lg text-ink">You might not be a defaulter.</h1>
            </Reveal>
            <Reveal delay={0.07}>
              <p className="t-subhead mt-6 max-w-xl text-ink-muted">
                You just don&rsquo;t know yet.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-2 max-w-xl text-[17px] leading-[1.6] text-ink-muted">
                Upload your hour-wise attendance PDF, mark the hours you missed for placement
                activities, and see your adjusted attendance estimate instantly.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/calculator" className="btn-primary">
                  Calculate my attendance
                  <Arrow />
                </Link>
              </div>
              <p className="mt-5 text-[13px] text-ink-tertiary">
                Runs entirely in your browser · No account · Nothing uploaded
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15} y={28} className="lg:sticky lg:top-24">
            <HeroArt />
          </Reveal>
        </div>
      </section>

      {/* ---------------- story ---------------- */}
      <section id="story" className="border-t border-hairline bg-surface-1/40 py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Reveal>
                <p className="t-eyebrow eyebrow-dot text-ink-subtle">Why this exists</p>
                <h2 className="t-display-md mt-6 text-ink">
                  &ldquo;Itna defaulter tu hai hi kyun?&rdquo;
                </h2>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="panel mt-8 p-6">
                  <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="Illustration of a parent's message and a student's reply">
                    <rect x="8" y="12" width="196" height="52" rx="12" fill="#141516" stroke="#23252a" />
                    <text x="26" y="34" fill="#f7f8f8" fontSize="13" fontWeight="500">
                      why were you absent AGAIN?
                    </text>
                    <text x="26" y="52" fill="#8a8f98" fontSize="12">
                      it says 79% attendance
                    </text>

                    <rect x="92" y="78" width="220" height="58" rx="12" fill="#0f1011" stroke="#22d3ee" />
                    <text x="112" y="100" fill="#d0d6e0" fontSize="13">
                      that was a placement drive.
                    </text>
                    <text x="112" y="119" fill="#8a8f98" fontSize="12">
                      it isn&rsquo;t counted. yet.
                    </text>

                    <circle cx="30" cy="112" r="4" fill="#22d3ee" />
                    <path d="M40 112h36" stroke="#23252a" strokeWidth="2" strokeDasharray="3 4" />
                  </svg>
                </div>
              </Reveal>
            </div>

            <div className="space-y-6 text-[17px] leading-[1.7] text-ink-muted">
              <Reveal delay={0.05}>
                <p className="text-ink">Placement season has a funny way of messing with your attendance.</p>
                <ul className="mt-4 space-y-1.5">
                  {RAPID.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.1}>
                <p>
                  Your attendance report sees one thing:{' '}
                  <span className="font-semibold tracking-[1px] text-ink">Absent.</span> What it
                  doesn&rsquo;t see is that you were sitting in a placement drive. The Placement
                  Cell eventually grants attendance for eligible placement activities, but that
                  adjustment happens later.
                </p>
              </Reveal>

              <Reveal delay={0.14}>
                <blockquote className="border-l-2 border-primary pl-5">
                  <p className="t-subhead text-ink">
                    Am I actually a defaulter, or is placement attendance just not counted yet?
                  </p>
                </blockquote>
              </Reveal>

              <Reveal delay={0.18}>
                <p>
                  This is where placement season gets annoying. Your attendance report comes in.{' '}
                  <span className="text-ink">One subject is sitting below 80%.</span>
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <p>
                  You know you&rsquo;ve missed a few lectures because of placement tests,
                  interviews and hiring drives. But those hours haven&rsquo;t been credited yet.
                </p>
              </Reveal>

              <Reveal delay={0.24}>
                <p className="text-ink">So what do you do?</p>
                <ol className="mt-4 overflow-hidden rounded-lg border border-hairline">
                  {RITUAL.map((item, i) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 border-b border-hairline bg-surface-1 px-4 py-2.5 text-[14px] last:border-b-0"
                    >
                      <span className="font-mono text-[11px] text-ink-tertiary">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className={i === RITUAL.length - 1 ? 'text-ink' : 'text-ink-muted'}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ol>
              </Reveal>

              <Reveal delay={0.28}>
                <p>
                  It&rsquo;s not exactly difficult. It&rsquo;s just{' '}
                  <span className="text-ink">
                    annoying enough to do badly when you&rsquo;re doing it for every subject.
                  </span>
                </p>
              </Reveal>
              <Reveal delay={0.32}>
                <p className="text-ink">So I built a small tool to do it properly.</p>
                <p className="mt-2 font-medium text-ink">
                  Drop the PDF. Mark the hours. Get the number.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section id="how" className="border-t border-hairline py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-5">
          <Reveal>
            <p className="t-eyebrow eyebrow-dot text-ink-subtle">How it works</p>
            <h2 className="t-display-md mt-6 max-w-2xl text-ink">Three steps. That&rsquo;s it.</h2>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.08}>
                <div className="panel flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md border border-hairline bg-surface-2 text-primary">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        {step.icon}
                      </svg>
                    </span>
                    <span className="font-mono text-[12px] text-ink-tertiary">{step.n}</span>
                  </div>
                  <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.3px] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ink-subtle">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.12}>
            <p className="mt-8 text-[15px] text-ink-subtle">
              You can also generate an A4 report with the complete list of hours you&rsquo;ve
              marked.
            </p>
          </Reveal>

          {/* product panel */}
          <Reveal delay={0.14}>
            <div className="panel mt-10 overflow-hidden">
              <div className="flex items-center gap-3 border-b border-hairline px-5 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-surface-4" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-4" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-4" />
                <span className="ml-2 font-mono text-[12px] text-ink-tertiary">
                  SAMPLE STUDENT · R001 · 01.01.2026 → 28.02.2026
                </span>
              </div>
              <div className="grid gap-0 md:grid-cols-[1.35fr_1fr]">
                <div className="border-b border-hairline p-5 md:border-b-0 md:border-r">
                  <p className="t-eyebrow text-ink-tertiary">Course attendance</p>
                  <ul className="mt-4 space-y-3.5">
                    {[
                      ['Applied Systems', '80.00%', '8/10 hrs', 80],
                      ['Technical Writing', '75.00%', '6/8 hrs', 75],
                      ['Data Methods', '72.00%', '6/8 hrs', 72],
                      ['Network Design', '90.00%', '9/10 hrs · +1 credited', 90],
                    ].map(([name, pct, hrs, w]) => (
                      <li key={name as string}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[14px] text-ink-muted">{name}</span>
                          <span className="font-mono text-[14px] font-medium text-ink">{pct}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                            <span
                              className={`block h-full rounded-full ${Number(w) === 100 ? 'bg-success' : 'bg-primary'}`}
                              style={{ width: `${w}%` }}
                            />
                          </div>
                          <span className="w-40 shrink-0 text-right text-[12px] text-ink-tertiary">
                            {hrs}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-5">
                  <p className="t-eyebrow text-ink-tertiary">Saved drives</p>
                  <ul className="mt-4 space-y-3">
                    {[
                      ['Quantiphi', '2 hrs · Mumbai hiring drive'],
                      ['Capgemini', '3 hrs · SE interview round'],
                      ['Marsh', '1 hr · BI advisory screening'],
                    ].map(([name, meta]) => (
                      <li
                        key={name}
                        className="flex items-center justify-between gap-3 rounded-md border border-hairline bg-surface-2 px-3.5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-ink">{name}</p>
                          <p className="truncate text-[12px] text-ink-tertiary">{meta}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-hairline bg-surface-3 px-2 py-0.5 font-mono text-[11px] text-ink-subtle">
                          excused
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 rounded-md border border-hairline bg-surface-2 px-3.5 py-3">
                    <p className="text-[12px] leading-relaxed text-ink-subtle">
                      Mark hours in the list to open the form. Company names come from a list you
                      can edit — no redeploy needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- the difference ---------------- */}
      <section className="border-t border-hairline bg-surface-1/40 py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-5">
          <Reveal>
            <p className="t-eyebrow eyebrow-dot text-ink-subtle">The difference</p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              ['~15–20 min', 'of opening PDFs, counting hours and doing the maths yourself.', false],
              ['< 60 sec', 'to get the adjusted estimate.', true],
              ['0', 'files uploaded anywhere.', false],
            ].map(([stat, body, accent], i) => (
              <Reveal key={stat as string} delay={i * 0.07}>
                <div className="panel h-full p-6">
                  <p
                    className={`font-mono text-[30px] font-medium tracking-[-1.5px] ${accent ? 'text-primary' : 'text-ink'}`}
                  >
                    {stat}
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-subtle">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mt-6 text-[14px] text-ink-subtle">
              <span className="text-ink">Your attendance PDF stays in your browser.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------- features ---------------- */}
      <section className="border-t border-hairline py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-5">
          <Reveal>
            <p className="t-eyebrow eyebrow-dot text-ink-subtle">Built for one job</p>
            <h2 className="t-display-md mt-6 max-w-3xl text-ink">
              Nothing extra. Just the calculation you actually need.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="panel flex gap-4 p-6">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-2 text-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                      {f.icon}
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-[16px] font-semibold tracking-[-0.2px] text-ink">{f.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-ink-subtle">{f.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- before / after ---------------- */}
      <section className="border-t border-hairline bg-surface-1/40 py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-5">
          <Reveal>
            <h2 className="t-display-md max-w-3xl text-ink">
              See what your attendance could look like.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="panel mt-10 overflow-hidden">
              <div className="grid md:grid-cols-[1fr_auto_1fr]">
                <div className="p-7">
                  <p className="t-eyebrow text-ink-tertiary">Current attendance</p>
                  <p className="mt-4 font-mono text-[52px] font-medium leading-none tracking-[-2px] text-ink-subtle">
                    72.41%
                  </p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <span className="block h-full rounded-full bg-[#e06c75]" style={{ width: '72.41%' }} />
                  </div>
                  <p className="mt-3 text-[13px] text-ink-tertiary">Below the 80% requirement</p>
                </div>

                <div className="hidden items-center justify-center border-x border-hairline px-6 md:flex">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-primary">
                    <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="border-t border-hairline p-7 md:border-t-0">
                  <p className="t-eyebrow text-ink-tertiary">Adjusted estimate</p>
                  <p className="mt-4 font-mono text-[52px] font-medium leading-none tracking-[-2px] text-success">
                    82.00%
                  </p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <span className="block h-full rounded-full bg-success" style={{ width: '82%' }} />
                  </div>
                  <p className="mt-3 text-[13px] text-primary">+12 placement hours marked</p>
                </div>
              </div>

              <div className="border-t border-hairline bg-surface-2 px-7 py-5">
                <p className="max-w-3xl text-[14px] leading-relaxed text-ink-muted">
                  That doesn&rsquo;t mean your college has officially granted those hours. It means{' '}
                  <span className="text-ink">
                    this is what your attendance would look like if those eligible placement hours
                    are credited.
                  </span>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- fine print (mid-page disclaimer) ---------------- */}
      <section id="fine-print" className="border-t border-hairline py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-5">
          <Reveal>
            <div className="panel relative overflow-hidden p-7 lg:p-10">
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
                <span className="flex h-11 w-11 items-center justify-center rounded-md border border-hairline-strong bg-surface-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5 text-primary">
                    <path d="M12 9v5m0 3.5h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  </svg>
                </span>
                <div>
                  <p className="t-eyebrow text-ink-tertiary">Read this before you rely on the number</p>
                  <h2 className="t-headline mt-3 text-ink">
                    This is an estimate, not an official attendance record.
                  </h2>

                  <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink-muted">
                    <p>
                      The calculator treats the placement-related hours you select as attended and
                      recalculates your percentage accordingly.
                    </p>
                    <p>
                      Whether those hours are actually granted is decided by your college and
                      Placement Office. The final attendance adjustment may happen later in the
                      semester, and the generated report is{' '}
                      <span className="text-ink">not an official college document</span>.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-hairline bg-surface-2 p-5">
                      <p className="t-eyebrow text-success">Use it to answer</p>
                      <p className="mt-2 text-[15px] text-ink">&ldquo;Am I probably safe?&rdquo;</p>
                    </div>
                    <div className="rounded-lg border border-hairline bg-surface-2 p-5">
                      <p className="t-eyebrow text-[#e06c75]">Not this</p>
                      <p className="mt-2 text-[15px] text-ink-muted">
                        &ldquo;The website says I&rsquo;m officially above the requirement.&rdquo;
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 text-[15px] text-ink">
                    Check the final figure with your course coordinator before making any
                    decisions.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-5 py-20 text-center lg:py-28">
          <Reveal>
            <h2 className="t-display-lg mx-auto max-w-3xl text-ink">Stop guessing.</h2>
            <p className="t-subhead mx-auto mt-6 max-w-xl text-ink-subtle">
              One PDF. A few ticks. And a much better answer to{' '}
              <span className="text-ink">&ldquo;Am I actually a defaulter?&rdquo;</span>
            </p>
            <div className="mt-9 flex justify-center">
              <Link href="/calculator" className="btn-primary">
                Calculate my attendance
                <Arrow />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- footer ---------------- */}
      <footer className="border-t border-hairline bg-canvas">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <span className="wordmark">
            Attendly
          </span>
          <div className="flex flex-wrap items-center gap-5 text-[13px] text-ink-subtle">
            <a href="#story" className="transition hover:text-ink">Why</a>
            <a href="#how" className="transition hover:text-ink">How it works</a>
            <a href="#fine-print" className="transition hover:text-ink">Fine print</a>
            <Link href="/calculator" className="transition hover:text-ink">Calculator</Link>
          </div>
          <p className="font-mono text-[12px] text-ink-tertiary">
            Runs locally · No account · Not an official record
          </p>
        </div>
      </footer>
    </div>
  );
}
