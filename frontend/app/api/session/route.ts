import { NextResponse } from "next/server";
import { getAccessToken } from "@/app/src/lib/actions";
import apiService from "@/app/services/apiService";

export async function GET() {
    const token = await getAccessToken();

    if (!token) {
        return NextResponse.json({ authenticated: false });
    }

    try {
        const res = await apiService.get('api/auth/me')
        console.log("Res: ", res)

        if (!res.ok) {
            return NextResponse.json({ authenticated: false });
        }

        const data = await res.json();
        return NextResponse.json({ authenticated: true, portal_access: data.portal_access });
    } catch {
        return NextResponse.json({ authenticated: false });
    }
}