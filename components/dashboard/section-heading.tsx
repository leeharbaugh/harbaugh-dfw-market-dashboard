type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: SectionHeadingProps) {
  return (
    <header className="mb-3 sm:mb-4">
      {eyebrow ? (
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-stone-400">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="mt-1 font-sans text-lg font-semibold tracking-tight text-stone-900 sm:text-xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-stone-500">
          {description}
        </p>
      ) : null}
    </header>
  );
}
