import React from "react";
import { TopAppBar } from "../TopAppBar";
import { useScreenStack } from "../ScreenStack";

interface MobileRouteStubProps {
  id: string;
  title: string;
  variant?: "main" | "detail";
  backLabel?: string;
  rightSlot?: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}

export const MobileRouteStub: React.FC<MobileRouteStubProps> = ({
  title,
  variant = "main",
  backLabel = "Back",
  rightSlot,
  description,
  children,
}) => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant={variant}
        title={variant === "detail" ? title : undefined}
        backLabel={backLabel}
        onBack={pop}
        rightSlot={rightSlot}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {children ? (
          children
        ) : (
          <div className="flex flex-col items-center max-w-xs mx-auto">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
            <span className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              Coming soon
            </span>
          </div>
        )}
      </main>
    </div>
  );
};
