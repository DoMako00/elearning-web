import { Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { SearchBarProps } from "./search-bar.types";
import { SearchModal } from "./SearchModal";
import { Skeleton } from "../Skeleton";

const DEFAULT_PLACEHOLDER = "Search courses, topics or skills...";

export function SearchBar({
  value,
  placeholder = DEFAULT_PLACEHOLDER,
  onChange,
  onSubmit,
  className = "",
  isLoading = false,
}: SearchBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState("");
  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : uncontrolledValue;

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsModalOpen(true);
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(inputValue);
    } else {
      setIsModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div
        aria-hidden="true"
        aria-label="Loading search bar"
        className={`search-bar flex h-15 w-full min-w-0 items-center justify-between rounded-2xl border border-gray-200 bg-white/70 px-4 ${className}`}
      >
        <div className="flex items-center gap-3 flex-1">
          <Skeleton width={20} height={20} circle />
          <Skeleton width="45%" height={16} borderRadius={4} />
        </div>
        <Skeleton width={42} height={28} borderRadius={8} />
      </div>
    );
  }

  return (
    <>
      <form
        className={`search-bar flex h-15 w-full min-w-0 items-center rounded-2xl border border-[--color-border-subtle] bg-[--color-surface] pl-5.25 pr-3.25 ${className} backdrop-blur-xs border-gray-200`}
        role="search"
        onSubmit={handleSubmit}
        onClick={() => setIsModalOpen(true)}
      >
        <Search
          className="size-5.25 shrink-0 text-[--color-text-secondary]"
          strokeWidth={1.7}
          aria-hidden="true"
        />
        <input
          type="search"
          value={inputValue}
          placeholder={placeholder}
          aria-label={placeholder}
          readOnly
          className="h-full min-w-0 flex-1 cursor-pointer border-0 bg-transparent px-0 pl-3.25 text-[15px] font-normal text-[--color-text-primary] outline-none placeholder:text-[--color-text-secondary]"
          onClick={() => setIsModalOpen(true)}
          onChange={(event) => {
            const nextValue = event.target.value;

            if (!isControlled) {
              setUncontrolledValue(nextValue);
            }

            onChange?.(nextValue);
          }}
        />
        <kbd
          className="search-bar__shortcut grid h-8.75 w-12.5 shrink-0 place-items-center rounded-[9px] border border-gray-200 bg-[--color-surface-hover] text-[14px] font-medium leading-none text-gray-500 cursor-pointer "
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          ⌘ K
        </kbd>
      </form>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
