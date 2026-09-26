import type { ReactNode } from "react";

interface AuthIllustrationCardProps {
  image: string;
  alt: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function AuthIllustrationCard({ image, alt, title, description, children }: AuthIllustrationCardProps) {
  return (
    <div className="auth-illustration-card">
      <img src={image} alt={alt} />
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {children}
      </div>
    </div>
  );
}
