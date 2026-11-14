import { Link } from "@tanstack/react-router";
import { SMARTY_WORKOUT_CATEGORIES } from "@/lib/smarty-workouts.functions";
import { CATEGORY_DETAILS, categorySlug } from "@/lib/smarty-workout-categories";
import { categoryLabel } from "@/lib/smarty-workout-row";

/** Mobile-only scrollable category tiles; the selected one uses the brand-blue state. */
export function MobileCategoryTiles({ selected }: { selected?: string }) {
  return (
    <nav aria-label="Workout categories" className="mb-4 md:hidden">
      <ul className="grid grid-cols-4 gap-2">
        {SMARTY_WORKOUT_CATEGORIES.map((category) => {
          const { Icon } = CATEGORY_DETAILS[category];
          const active = selected === category;
          return (
            <li key={category}>
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
