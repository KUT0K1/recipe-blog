/** Rendered statically on the home page and inside the search island. */
export interface RecipeCardData {
  url: string;
  title: string;
  description: string;
  meta: string[];
  image: { src: string; srcset: string; sizes: string; width: number; height: number; alt: string };
}

export default function RecipeCard({ card }: { card: RecipeCardData }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-surface shadow-sm ring-1 ring-line transition hover:shadow-md">
      <img
        src={card.image.src}
        srcSet={card.image.srcset}
        sizes={card.image.sizes}
        width={card.image.width}
        height={card.image.height}
        alt={card.image.alt}
        loading="lazy"
        decoding="async"
        className="aspect-[3/2] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-xl font-bold">
          <a href={card.url} className="text-fg after:absolute after:inset-0 hover:underline">
            {card.title}
          </a>
        </h3>
        <p className="text-fg-soft">{card.description}</p>
        <p className="mt-auto text-sm text-fg-muted">{card.meta.join(" · ")}</p>
      </div>
    </article>
  );
}
