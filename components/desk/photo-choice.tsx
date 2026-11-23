import Image from "next/image";

export type PhotoOption = { url: string; label: string };

/** Radio picker with real thumbnails — the senior-friendly way to choose a photograph. */
export function PhotoChoice({
  name,
  current,
  photos,
  noneLabel,
}: {
  name: string;
  current: string;
  photos: PhotoOption[];
  noneLabel: string;
}) {
  return (
    <div className="desk-photo-choice">
      <label className="desk-photo-none">
        <input type="radio" name={name} value="" defaultChecked={!current} />
        <span>{noneLabel}</span>
      </label>
      {photos.map((photo) => (
        <label key={photo.url} className="desk-photo-option" title={photo.label}>
          <input type="radio" name={name} value={photo.url} defaultChecked={current === photo.url} />
          <span className="desk-photo-frame">
            <Image src={photo.url} alt={photo.label} fill sizes="(min-width: 64rem) 8rem, 30vw" className="object-cover" />
          </span>
          <span className="desk-photo-label">{photo.label}</span>
        </label>
      ))}
    </div>
  );
}
