// NotFound.jsx — Shown for any URL that doesn't match a page.

import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section>
      <h1 className="text-[1.75rem] font-medium leading-tight">Page not found</h1>
      <p className="mt-2 text-ink-secondary">
        This page doesn’t exist.{" "}
        <Link to="/" className="font-medium text-link underline underline-offset-2">
          Go to My Recipes
        </Link>
      </p>
    </section>
  );
}