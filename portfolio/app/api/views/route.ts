import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const counter = await prisma.viewCounter.findUnique({
      where: { id: "portfolio" },
      select: { count: true },
    });

    return NextResponse.json({ views: counter?.count ?? 0 });
  } catch (error) {
    console.error("Failed to fetch portfolio view count:", error);
    return NextResponse.json(
      { error: "Unable to fetch view count." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const counter = await prisma.viewCounter.upsert({
      where: { id: "portfolio" },
      create: { id: "portfolio", count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    return NextResponse.json({ views: counter.count });
  } catch (error) {
    console.error("Failed to increment portfolio view count:", error);
    return NextResponse.json(
      { error: "Unable to increment view count." },
      { status: 500 }
    );
  }
}
