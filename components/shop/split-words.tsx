import { Fragment } from "react";
import { cn } from "@/lib/cn";

type Props = {
  text: string;
  as?: "h1" | "h2" | "p";
  className?: string;
  id?: string;
};

/** Words sit in clipped boxes so motion can lift them; the plain text stays readable without JS. */
export function SplitWords({ text, as: Tag = "h2", className, id }: Props) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag id={id} className={cn(className)} aria-label={text} data-split="">
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="split-line" aria-hidden="true">
            <span className="split-inner">{word}</span>
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
