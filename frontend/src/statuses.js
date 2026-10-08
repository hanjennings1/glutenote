// statuses.js — The three gluten-free statuses, in one place.
// Used by StatusBadge (labels, icons, colors) and the filter chips on My recipes.
// The keys match the gf_status values stored in the database.

import { WheatOff, CircleCheck, Leaf } from "lucide-react";

export const STATUSES = {
  needs_adapting: {
    label: "Needs adapting",
    icon: WheatOff,
    className: "bg-flag-bg text-flag-text", // bordeaux: gluten still present
  },
  adapted: {
    label: "Adapted",
    icon: CircleCheck,
    className: "bg-primary text-white", // solid pine: done
  },
  naturally_gf: {
    label: "Naturally GF",
    icon: Leaf,
    className: "bg-pine-100 text-pine-800", // pine tint: no gluten found
  },
};