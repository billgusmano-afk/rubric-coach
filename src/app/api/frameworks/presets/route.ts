import { NextResponse } from "next/server";
import { PRESET_FRAMEWORKS } from "@/lib/frameworks";

export async function GET() {
  return NextResponse.json(PRESET_FRAMEWORKS);
}
