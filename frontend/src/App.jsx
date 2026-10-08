// App.jsx — The app's layout and page routes.
// The NavBar shows on every page; <Routes> picks which page to show below it
// based on the URL.

import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import RecipeList from "./pages/RecipeList";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeForm from "./pages/RecipeForm";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/" element={<RecipeList />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/recipes/new" element={<RecipeForm />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/recipes/:id/edit" element={<RecipeForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}