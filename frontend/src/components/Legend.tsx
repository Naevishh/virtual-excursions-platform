import type { Category } from "../types";
import { categoryColor, categoryEmoji } from "../utils/format";

interface LegendProps {
  categories: Category[];
}

export default function Legend({ categories }: LegendProps) {
  if (!categories.length) return null;

  return (
    <div className="legend">
      <div className="legend-title">Легенда</div>
      <div className="legend-items">
        {categories.map((category) => (
          <div key={category.slug} className="legend-item">
            <span
              className="legend-dot"
              style={{
                backgroundColor: category.color || categoryColor(category.slug),
              }}
            >
              {categoryEmoji(category.slug)}
            </span>
            <span>{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
