import Image from "next/image";

export function Avatar({
  src,
  name,
  size = 32,
}: {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: number;
}) {
  if (!src) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.42 }}
        className="flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      >
        {(name ?? "?").slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={name ?? ""}
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
