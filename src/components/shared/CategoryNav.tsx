"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  slug: string;
  icon?: string | null;
}

interface CategoryNavProps {
  categories: Category[];
  basePath?: string;
}

export default function CategoryNav({ categories, basePath = "/posts" }: CategoryNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || (pathname.includes("/categories/") ? pathname.split("/categories/")[1] : "");

  const allCategories = [{ name: "全部", slug: "", icon: "🔥" }, ...categories];

  return (
    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
      {allCategories.map((cat) => {
        const isActive = cat.slug === currentCategory || (cat.slug === "" && !currentCategory);
        const href = cat.slug ? `${basePath}?category=${cat.slug}` : basePath;

        return (
          <Link
            key={cat.slug || "all"}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
              isActive
                ? "bg-primary text-white"
                : "bg-white text-text-secondary hover:bg-primary-light hover:text-primary border border-border-light"
            )}
          >
            {cat.icon && <span>{cat.icon}</span>}
            <span>{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
