"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Framework {
  id: string;
  name: string;
  description: string;
  selling_motion: string;
  is_template: boolean;
  created_at: string;
  criteria: { id: string; name: string }[];
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/frameworks");
        if (res.ok) {
          const data = await res.json();
          setFrameworks(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-8 max-w-[960px]">
      <div className="mb-7">
        <h1 className="font-serif text-[26px] text-ink">My Frameworks</h1>
        <p className="text-ink-3 text-sm">Rubrics powering your coaching sessions</p>
      </div>

      {loading ? (
        <div className="text-ink-3 text-sm">Loading frameworks...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {frameworks.map((fw) => (
            <div
              key={fw.id}
              className="bg-card border border-border border-l-[3px] border-l-accent rounded-[12px] p-5 shadow-card"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="font-semibold text-sm">{fw.name}</div>
                  </div>
                  <div className="text-xs text-ink-3 mb-3">
                    {fw.criteria.length} criteria &middot;{" "}
                    {fw.criteria.map((c) => c.name).join(", ")}
                  </div>
                  {fw.selling_motion && (
                    <div className="text-xs text-ink-3 italic">{fw.selling_motion}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/builder?edit=${fw.id}`}
                    className="px-3 py-1.5 bg-white text-accent border border-border rounded-sm text-xs font-medium hover:border-accent transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href="/dashboard/roleplay"
                    className="px-3 py-1.5 bg-accent text-white rounded-sm text-xs font-medium hover:bg-[#4a3ce0] transition-colors"
                  >
                    Practice
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {frameworks.length === 0 && (
            <div className="text-center py-12 text-ink-3 text-sm">
              No frameworks yet. Build your first rubric!
            </div>
          )}

          {/* Add new */}
          <div className="bg-surface border border-dashed border-border rounded-[12px] p-5">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm text-ink-3">+ Add Another Framework</div>
                <div className="text-xs text-ink-3">
                  Build a custom rubric or start from a template &middot; +$5/user/month
                </div>
              </div>
              <Link
                href="/dashboard/builder"
                className="px-4 py-2 bg-white text-accent border border-border rounded-sm text-sm font-medium hover:border-accent transition-colors"
              >
                Build Rubric
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
