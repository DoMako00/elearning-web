import "./BrandLogo.css";

interface BrandLogoProps {
  brandName: string;
  src: string;
  className: string;
}

/** Renders the complete supplied brand lockup, including any wordmark inside the image. */
export function BrandLogo({ brandName, src, className }: BrandLogoProps) {
  return <img className={`brand-logo ${className}`} src={src} alt={`${brandName} logo`} />;
}
