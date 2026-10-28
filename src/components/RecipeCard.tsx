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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:shadow-md">
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
          <a
            href={card.url}
            className="text-stone-900 after:absolute after:inset-0 hover:underline"
          >
            {card.title}
          </a>
        </h3>
        <p className="text-stone-700">{card.description}</p>
        <p className="mt-auto text-sm text-stone-600">{card.meta.join(" · ")}</p>
      </div>
    </article>
  );
}
