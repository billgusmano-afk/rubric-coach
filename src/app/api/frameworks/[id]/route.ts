import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PUT /api/frameworks/[id] — update framework + criteria + score_levels
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, selling_motion, criteria } = body;

  // Update the framework
  const { error: fwError } = await supabase
    .from("frameworks")
    .update({
      name,
      description: description || null,
      selling_motion: selling_motion || null,
    })
    .eq("id", params.id)
    .eq("created_by", user.id);

  if (fwError) {
    return NextResponse.json({ error: fwError.message }, { status: 500 });
  }

  // Replace criteria: delete old, insert new
  if (criteria && Array.isArray(criteria)) {
    // Delete existing criteria (cascade deletes score_levels)
    await supabase.from("criteria").delete().eq("framework_id", params.id);

    for (let i = 0; i < criteria.length; i++) {
      const c = criteria[i];
      const { data: criterion, error: cError } = await supabase
        .from("criteria")
        .insert({
          framework_id: params.id,
          name: c.name,
          description: c.description || null,
          weight_percent: c.weight_percent || 0,
          display_order: i,
        })
        .select()
        .single();

      if (cError) {
        return NextResponse.json({ error: cError.message }, { status: 500 });
      }

      if (c.score_levels && Array.isArray(c.score_levels)) {
        const levels = c.score_levels.map(
          (sl: { level: number; label: string; description?: string }) => ({
            criterion_id: criterion.id,
            level: sl.level,
            label: sl.label,
            description: sl.description || null,
          })
        );

        const { error: slError } = await supabase
          .from("score_levels")
          .insert(levels);

        if (slError) {
          return NextResponse.json({ error: slError.message }, { status: 500 });
        }
      }
    }
  }

  // Return updated framework
  const { data: result } = await supabase
    .from("frameworks")
    .select(
      `
      *,
      criteria (
        *,
        score_levels (*)
      )
    `
    )
    .eq("id", params.id)
    .single();

  return NextResponse.json(result);
}
