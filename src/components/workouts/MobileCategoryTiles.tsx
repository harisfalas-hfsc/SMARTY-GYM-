import { Link } from "@tanstack/react-router";
import { SMARTY_WORKOUT_CATEGORIES } from "@/lib/smarty-workouts.functions";
import { CATEGORY_DETAILS, categorySlug } from "@/lib/smarty-workout-categories";
import { categoryLabel } from "@/lib/smarty-workout-row";

/** Mobile-only scrollable category tiles; the selected one uses the brand-blue state. */
export function MobileCategoryTiles({ selected }: { selected?: string }) {
  return (
    <nav aria-label="Workout categories" className="-mx-4 mb-4 overflow-x-auto px-4 md:hidden [scrollbar-width:none]">
      <ul className="flex gap-2 pb-1">
        {SMARTY_WORKOUT_CATEGORIES.map((category) => {
          const { Icon } = CATEGORY_DETAILS[category];
          const active = selected === category;
          return (
            <li key={category} className="shrink-0">
              <Link
                to="/smarty-workouts/category/$category"
                params={{ category: categorySlug(category) }}
                aria-current={active ? "page" : undefined}
                className={`mobile-category-tile ${active ? "is-active" : ""}`}
              >
                <Icon className="h-6 w-6" />
                <span>{categoryLabel(category)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
