import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { SavedItemsProvider } from "../state/useSavedItems";

export function App() {
  return (
    <SavedItemsProvider>
      <RouterProvider router={router} />
    </SavedItemsProvider>
  );
}
