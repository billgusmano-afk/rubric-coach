"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navSections = [
  {
    label: "Practice",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "\u2B21" },
      { name: "Start Roleplay", href: "/dashboard/roleplay", icon: "\u25CE" },
      { name: "Session History", href: "/dashboard/history", icon: "\u25F7" },
    ],
  },
  {
    label: "Rubrics",
    items: [
      { name: "My Frameworks", href: "/dashboard/frameworks", icon: "\u25C8" },
      { name: "Build Rubric", href: "/dashboard/builder", icon: "\u2726" },
    ],
  },
  {
    label: "Team",
    items: [
      { name: "Analytics", href: "/dashboard/analytics", icon: "\u25C9" },
      { name: "Billing", href: "/dashboard/settings/billing", icon: "\u25A3" },
    ],
  },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="w-[220px] bg-card border-r border-border p-6 flex flex-col gap-1.5 shrink-0">
      <div className="flex items-center gap-2 mb-6 px-2">
        <div className="w-2 h-2 bg-accent rounded-full" />
        <span className="font-serif text-lg text-accent">RubricCoach</span>
      </div>

      {navSections.map((section) => (
        <div key={section.label}>
          <span className="block text-[10px] font-semibold tracking-wider text-ink-3 uppercase px-3 pt-3 pb-1">
            {section.label}
          </span>
          {section.items.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] transition-all ${
                  isActive
                    ? "bg-accent/[0.08] text-accent font-medium"
                    : "text-ink-3 hover:bg-surface hover:text-ink"
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="flex-1" />

      <div className="p-3 bg-accent/[0.06] rounded-sm text-xs text-ink-3">
        <div className="font-semibold text-accent mb-0.5">Pro Plan</div>
        2 of 3 frameworks used
        <div className="mt-1.5 h-1.5 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: "66%" }} />
        </div>
      </div>

      <div className="mt-2 px-2 flex items-center justify-between">
        <span className="text-xs text-ink-3 truncate">{userName}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-ink-3 hover:text-red transition-colors"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
