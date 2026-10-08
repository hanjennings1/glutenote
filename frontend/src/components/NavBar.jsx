// NavBar.jsx — The pine header shown on every page.
// NavLink works like a link, but also knows when its page is the current one,
// so the active link can be styled differently.

import { Link, NavLink } from "react-router-dom";
import { Plus } from "lucide-react";

// Shared look for the two text links; the current page gets an underline.
function navLinkClass({ isActive }) {
  return [
    "rounded-sm px-1 py-1 text-sm font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
    isActive
      ? "text-white underline decoration-2 underline-offset-8"
      : "text-white/75 hover:text-white",
  ].join(" ");
}

export default function NavBar() {
  return (
    <header className="bg-primary text-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        {/* Brand: small subtitle above the app name, per the style guide */}
        <Link
          to="/"
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <span className="block text-xs text-white/75">Your gluten-free recipe box</span>
          <span className="block text-xl font-medium leading-tight">Glutenote</span>
        </Link>

        <div className="flex items-center gap-5">
          {/* "end" makes My recipes active only on "/", not on every page */}
          <NavLink to="/" end className={navLinkClass}>
            My recipes
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            Search
          </NavLink>
          {/* White button on the pine header, so it reads as the main action */}
          <Link
            to="/recipes/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-pine-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Plus size={16} aria-hidden="true" />
            Add recipe
          </Link>
        </div>
      </nav>
    </header>
  );
}