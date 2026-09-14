import { cookies } from "next/headers"
import { jwtDecode } from "jwt-decode"


export type AuthUser = {
  id: string
  name: string
  email: string
  exp: number
}

export async function getAuthUser(): Promise<AuthUser | null> {
    const requestCookies = await cookies();
    const token = requestCookies.get("session_access_token")?.value

    if (!token) return null

    try {
        const decoded: any = jwtDecode(token)

        // console.log('getAuthUser: Decoded token:', decoded);
        // console.log('getAuthUser: Decoded name:', decoded.name);

        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) return null

        // Check if token is valid
        if (!decoded.sub || !decoded.email) {
            return null
        }

        return {
            id: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            exp: decoded.exp,
        }
    } catch {
        return null
    }
}