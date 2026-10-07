import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";

export interface Brand {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  accentColor?: string;
  accentHoverColor?: string;
  accentSoftColor?: string;
}

interface BrandContextValue {
  brand: Brand;
}

const defaultBrand: Brand = {
  id: "default",
  name: "GreenLearn",
  shortName: "GL",
};

const defaultBrandContext: BrandContextValue = {
  brand: defaultBrand,
};

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

export function BrandProvider({ children }: PropsWithChildren) {
  return (
    <BrandContext.Provider value={defaultBrandContext}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);

  if (!context) {
    throw new Error("useBrand must be used within BrandProvider.");
  }

  return context;
}
