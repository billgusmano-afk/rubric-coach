import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/frameworks — list all frameworks for the user's team
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's team IDs
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const teamIds = memberships?.map((m) => m.team_id) || [];

  if (teamIds.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch frameworks with criteria and score levels
  const { data: frameworks, error } = await supabase
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
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(frameworks);
}

// POST /api/frameworks — create framework with criteria + score_levels
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, selling_motion, criteria } = body;

  // Get user's team
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  // Check subscription framework slots
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("framework_slots")
    .eq("team_id", membership.team_id)
    .single();

  const { count: existingCount } = await supabase
    .from("frameworks")
    .select("id", { count: "exact", head: true })
    .eq("team_id", membership.team_id);

  if (
    subscription &&
    existingCount !== null &&
    existingCount >= subscription.framework_slots
  ) {
    return NextResponse.json(
      { error: "upgrade_required", message: "Framework slot limit reached. Upgrade your plan." },
      { status: 403 }
    );
  }

  // Create framework
  const { data: framework, error: fwError } = await supabase
    .from("frameworks")
    .insert({
      team_id: membership.team_id,
      created_by: user.id,
      name,
      description: description || null,
      selling_motion: selling_motion || null,
    })
    .select()
    .single();

  if (fwError) {
    return NextResponse.json({ error: fwError.message }, { status: 500 });
  }

  // Create criteria and score levels
  if (criteria && Array.isArray(criteria)) {
    for (let i = 0; i < criteria.length; i++) {
      const c = criteria[i];
      const { data: criterion, error: cError } = await supabase
        .from("criteria")
        .insert({
          framework_id: framework.id,
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

      // Insert score levels for this criterion
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

  // Return the full framework with nested data
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
    .eq("id", framework.id)
    .single();

  return NextResponse.json(result, { status: 201 });
}
