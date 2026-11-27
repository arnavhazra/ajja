import Image from "next/image";

export type PhotoOption = { url: string; label: string };

/** Radio picker with real thumbnails, collapsed to the photograph already chosen. */
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
  const currentPhoto = photos.find((photo) => photo.url === current);
  return (
    <fieldset className="desk-photo-choice-field grid gap-2">
      <legend className="text-lg">{label}</legend>
      <details className="desk-photo-picker">
        <summary>
          <span className="desk-photo-current" aria-hidden="true">
            {currentPhoto ? (
              <Image src={currentPhoto.url} alt="" fill sizes="5rem" className="object-cover" />
            ) : (
              <span>No photo</span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{currentPhoto?.label ?? noneLabel}</span>
            <span className="block text-tar-soft">Choose a different photograph</span>
          </span>
        </summary>
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
      </details>
    </fieldset>
  );
}
