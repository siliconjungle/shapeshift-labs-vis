import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export async function GET() {
  const modelsDir = path.join(process.cwd(), "public", "models");
  try {
    const entries = await fs.readdir(modelsDir);
    const models = entries.filter((name) =>
      name.toLowerCase().endsWith(".glb")
    );
    return NextResponse.json({ models });
  } catch (err) {
    console.error("Error reading models directory:", err);
    return NextResponse.json({ models: [] });
  }
}
