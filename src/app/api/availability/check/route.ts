// src/app/api/availability/check/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AvailabilityService } from "@/lib/services/availabilityService";
import { applyRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // 1. Aplicar un límite de peticiones para prevenir el abuso.
    const rateLimitResponse = await applyRateLimit(req, { requests: 30, window: '1 h' });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // 2. Autenticar la sesión del usuario (matchmaker).
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 3. Extraer el 'locale' de los parámetros de la URL.
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he'; // Por defecto, se establece en hebreo.

    // 4. Extraer el 'clientId' del cuerpo de la solicitud.
    const body = await req.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ success: false, error: "Bad Request: clientId is required." }, { status: 400 });
    }

    // 5. Llamar al servicio de disponibilidad, AHORA con el parámetro 'locale'.
    const result = await AvailabilityService.sendAvailabilityInquiry({
      matchmakerId: session.user.id,
      firstPartyId: clientId,
      locale: locale, // Se ha añadido el parámetro 'locale' que faltaba.
    });

    // 6. Devolver el resultado exitoso.
    return NextResponse.json({ success: true, inquiry: result });

  } catch (error) {
    // 7. Manejar cualquier error que ocurra durante el proceso.
    console.error("Error checking availability:", error);
    
    // Devolver un mensaje de error más específico si es posible.
    const errorMessage = error instanceof Error ? error.message : "Failed to check availability";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}