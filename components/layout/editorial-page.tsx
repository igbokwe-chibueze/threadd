import { Reveal } from "@/components/motion/reveal";

type EditorialSection = Readonly<{
  title: string;
  body: string;
}>;

type EditorialPageProps = Readonly<{
  eyebrow: string;
  title: string;
  introduction: string;
  sections: readonly EditorialSection[];
  note?: string;
}>;

export function EditorialPage({
  eyebrow,
  title,
  introduction,
  sections,
  note,
}: EditorialPageProps) {
  return (
    <main className="bg-[#ece8df] text-[#171713]">
      <section className="px-5 pt-20 pb-16 sm:px-10 lg:px-14 lg:pt-28 lg:pb-24">
        <Reveal>
          <p className="text-[0.62rem] font-bold tracking-[0.24em] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-6xl text-[clamp(4rem,10vw,9rem)] leading-[0.8] font-medium tracking-[-0.075em]">
            {title}
          </h1>
        </Reveal>
      </section>

      <section className="grid gap-14 border-t border-black/20 px-5 py-16 sm:px-10 lg:grid-cols-[1fr_2fr] lg:px-14 lg:py-24">
        <Reveal>
          <p className="max-w-xs text-[0.62rem] font-bold tracking-[0.22em] uppercase">
            THREADD / The details
          </p>
        </Reveal>
        <div>
          <Reveal>
            <p className="max-w-4xl text-3xl leading-[1.02] font-medium tracking-[-0.045em] sm:text-5xl">
              {introduction}
            </p>
          </Reveal>

          <div className="mt-16 grid">
            {sections.map((section, index) => (
              <Reveal key={section.title} delay={Math.min(index * 0.04, 0.16)}>
                <article className="grid gap-4 border-t border-black/20 py-7 sm:grid-cols-[3rem_1fr_2fr] sm:gap-6">
                  <span className="text-[0.6rem] font-bold text-black/45">
                    0{index + 1}
                  </span>
                  <h2 className="text-lg font-medium">{section.title}</h2>
                  <p className="max-w-2xl text-sm leading-6 text-black/60">
                    {section.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          {note ? (
            <p className="mt-10 border-l-2 border-[#171713] pl-5 text-sm leading-6 text-black/60">
              {note}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
