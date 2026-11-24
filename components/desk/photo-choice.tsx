import Image from "next/image";

export type PhotoOption = { url: string; label: string };

/** Radio picker with real thumbnails — the senior-friendly way to choose a photograph. */
export function PhotoChoice({
  name,
  label,
  current,
  photos,
  noneLabel,
}: {
  name: string;
  label: string;
  current: string;
  photos: PhotoOption[];
  noneLabel: string;
}) {
  return (
    <fieldset className="desk-photo-choice-field grid gap-2">
      <legend className="text-lg">{label}</legend>
      <div className="desk-photo-choice">
        <label className="desk-photo-none">
          <input type="radio" name={name} value="" defaultChecked={!current} aria-label={noneLabel} />
          <span>{noneLabel}</span>
        </label>
        {photos.map((photo) => (
          <label key={photo.url} className="desk-photo-option" title={photo.label}>
            <input type="radio" name={name} value={photo.url} defaultChecked={current === photo.url} aria-label={photo.label} />
            <span className="desk-photo-frame">
              <Image src={photo.url} alt={photo.label} fill sizes="(min-width: 64rem) 8rem, 30vw" className="object-cover" />
            </span>
            <span className="desk-photo-label">{photo.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
