import { NextResponse } from "next/server";
import { getAuthUser } from "@/app/src/lib/auth";
import { getPortalAccess } from "@/app/src/lib/actions";

export async function GET() {
    const user = await getAuthUser();

    if (!user) {
        return NextResponse.json({ authenticated: false });
    }

    const portalAccess = await getPortalAccess();

    return NextResponse.json({
        authenticated: true,
        portal_access: portalAccess,
    });
}