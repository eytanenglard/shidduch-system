import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // וודא שהנתיב נכון לפרויקט שלך
import prisma from "@/lib/prisma"; // וודא שהנתיב נכון

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // שליפת הנתונים לפי הסכמה האמיתית שלך
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        termsAndPrivacyAcceptedAt: true,
        source: true, // חשוב לזיהוי מקור המשתמש
        status: true,
        isVerified: true,
        isProfileComplete: true,
        accounts: {
          select: { provider: true }
        },
        profile: {
          select: {
            gender: true,
            birthDate: true,
            maritalStatus: true,
            height: true,
            occupation: true, // ✅ זה השדה הנכון (במקום profession)
            education: true,
            religiousLevel: true,
            city: true,
            hasChildrenFromPrevious: true, // ✅ זה השדה הנכון לילדים
            // numberOfChildren: true, <--- מחקנו כי לא קיים בסכמה
          }
        }
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error("[REGISTRATION_INFO_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}