// src/app/api/profile/[userId]/name/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { firstName, lastName } = await req.json();
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: { firstName, lastName },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Name update error:', error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}