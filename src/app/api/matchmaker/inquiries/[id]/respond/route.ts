// src/app/api/matchmaker/inquiries/[id]/respond/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AvailabilityService } from "@/lib/services/availabilityService";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// La definición del tipo genérico para los parámetros de la ruta.
type RouteSegment<T> = (
  request: NextRequest,
  context: { params: T }
) => Promise<NextResponse> | NextResponse;

// El manejador de la solicitud.
const handler: RouteSegment<{ id: string }> = async (req, { params }) => {
  try {
    // 1. Aplicar un límite de peticiones para prevenir el abuso.
const rateLimitResponse = await applyRateLimitWithRoleCheck(req, { requests: 15, window: '1 h' });    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Autenticar la sesión del usuario.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 3. Extraer el 'locale' de los parámetros de la URL.
    //    Esta es la corrección principal para que coincida con la firma del servicio.
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he'; // Por defecto, se establece en hebreo.

    // 4. Extraer los datos del cuerpo de la solicitud.
    const { isAvailable, note } = await req.json();

    // Validar que 'isAvailable' sea un booleano.
    if (typeof isAvailable !== 'boolean') {
        return NextResponse.json({ success: false, error: "Bad Request: 'isAvailable' must be a boolean." }, { status: 400 });
    }

    // 5. Llamar al servicio de disponibilidad, AHORA con el parámetro 'locale'.
    const updatedInquiry = await AvailabilityService.updateInquiryResponse({
      inquiryId: params.id,
      userId: session.user.id,
      isAvailable,
      note,
      locale: locale, // Se ha añadido el parámetro 'locale' que faltaba.
    });

    // 6. Devolver una respuesta exitosa y consistente.
    return NextResponse.json({ success: true, inquiry: updatedInquiry });

  } catch (error) {
    // 7. Manejar cualquier error que ocurra.
    console.error("Error updating inquiry response:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to update response";
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
};

// Exportar el manejador como el método POST.
export const POST = handler;