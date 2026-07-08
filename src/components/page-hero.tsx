import Image from "next/image";

interface PageHeroProps {
  title: string;
  italicTitle?: boolean;
  subtitle?: string;
  imageUrl?: string | null;
  align?: "left" | "center";
  children?: React.ReactNode;
}

export function PageHero({
  title,
  italicTitle = false,
  subtitle,
  imageUrl,
  align = "center",
  children,
}: PageHeroProps) {
  const alignClass = align === "center" ? "text-center" : "text-start";

  // Split title on last word for italic rendering
  const words = title.split(" ");
  const lastWord = words.pop();
  const restWords = words.join(" ");

  return (
    <section className="relative overflow-hidden bg-surface-dark text-white">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : null}
      <div className="absolute inset-0 bg-hero-overlay" />
      <div
        className={`reveal relative mx-auto max-w-[1200px] px-5 pb-20 pt-24 md:px-8 md:pb-28 md:pt-32 ${alignClass}`}
      >
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
          {italicTitle && restWords ? (
            <>
              {restWords}{" "}
              <em className="italic">{lastWord}</em>
            </>
          ) : (
            title
          )}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium text-white/90 md:text-xl">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}