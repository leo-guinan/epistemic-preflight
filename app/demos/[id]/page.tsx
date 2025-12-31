import { notFound } from "next/navigation";
import DemoView from "./DemoView";
import type { DemoPaper } from "@/lib/demo-data-types";
import fs from "fs";
import path from "path";

// Load demo data from JSON files
function loadDemoData(id: string): DemoPaper | null {
  try {
    const filePath = path.join(process.cwd(), "data", "demos", `${id}.json`);
    const fileContents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents) as DemoPaper;
  } catch (error) {
    console.error(`Failed to load demo data for ${id}:`, error);
    return null;
  }
}

export default async function DemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demo = loadDemoData(id);

  if (!demo) {
    notFound();
  }

  return <DemoView demo={demo} />;
}

export async function generateStaticParams() {
  // Return all demo IDs for static generation
  return [
    { id: "stochastic-parrots" },
    { id: "attention" },
    { id: "alignment" },
  ];
}

