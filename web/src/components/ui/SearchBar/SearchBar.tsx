import { Search } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { SearchBarProps } from "./search-bar.types";

const DEFAULT_PLACEHOLDER = "Search courses, topics or skills...";

export function SearchBar({
  value,
  placeholder = DEFAULT_PLACEHOLDER,
  onChange,
  onSubmit,
  className = "",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState("");
  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : uncontrolledValue;

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(inputValue);
  };

  return (
    <form
      className={`search-bar flex h-[60px] w-full min-w-0 items-center rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] pl-[21px] pr-[13px] ${className}`}
      role="search"
      onSubmit={handleSubmit}
    >
      <Search
        className="size-[21px] shrink-0 text-[var(--color-text-secondary)]"
        strokeWidth={1.7}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={inputValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 pl-[13px] text-[15px] font-normal text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
        onChange={(event) => {
          const nextValue = event.target.value;

          if (!isControlled) {
            setUncontrolledValue(nextValue);
          }

          onChange?.(nextValue);
        }}
      />
      <kbd
        className="search-bar__shortcut grid h-[35px] w-[50px] shrink-0 place-items-center rounded-[9px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[14px] font-medium leading-none text-[var(--color-text-secondary)]"
        aria-hidden="true"
      >
        ⌘ K
      </kbd>
    </form>
  );
}
