export interface SearchBarProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
}
