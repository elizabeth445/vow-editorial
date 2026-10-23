import { weddingConfig } from "../data/weddingConfig";

/** The same upright initials and clear ampersand on the site and wax seal. */
export function MonogramMark() {
  return (
    <span className="monogram-mark" aria-hidden="true">
      <span className="monogram-initial">{weddingConfig.groom[0]}</span>
      <span className="monogram-amp">&</span>
      <span className="monogram-initial">{weddingConfig.bride[0]}</span>
    </span>
  );
}
