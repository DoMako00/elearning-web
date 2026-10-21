import "./BrandLogoMark.css";

interface BrandLogoMarkProps {
  brandName: string;
  src: string;
  className: string;
}

/** Shows the supplied brand mark while cropping its separate wordmark for compact app chrome. */
export function BrandLogoMark({ brandName, src, className }: BrandLogoMarkProps) {
  return (
    <span
      className={`brand-logo-mark ${className}`}
      role="img"
      aria-label={`${brandName} logo`}
      style={{ backgroundColor: "#eff8f2" }}
    >
      <img src={src} alt="" aria-hidden="true" />
    </span>
  );
}
