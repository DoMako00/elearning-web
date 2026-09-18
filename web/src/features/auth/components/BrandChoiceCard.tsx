import { Check, Cross, Sparkles } from "lucide-react";
import type { BrandOption } from "../types/authOnboarding.types";

interface BrandChoiceCardProps {
  brand: BrandOption;
  selected: boolean;
  onSelect: () => void;
}

export function BrandChoiceCard({ brand, selected, onSelect }: BrandChoiceCardProps) {
  const Icon = brand.id === "medway" ? Cross : Sparkles;

  return (
    <label className={`auth-brand-choice auth-brand-choice--${brand.id}${selected ? " is-selected" : ""}`}>
      <input type="radio" name="learning-brand" value={brand.id} checked={selected} onChange={onSelect} />
      <span className="auth-brand-choice__logo"><Icon aria-hidden="true" /></span>
      <span className="auth-brand-choice__copy">
        <strong>{brand.name}</strong>
        <span>{brand.description}</span>
        <small>{brand.categories}</small>
      </span>
      {selected && <span className="auth-brand-choice__check"><Check aria-hidden="true" /></span>}
    </label>
  );
}
