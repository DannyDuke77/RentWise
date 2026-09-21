import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authRoutes = ['/auth/login', '/auth/register'];
const publicRoutes = ['/accept-invitation'];

function redirectToLogin(
    request: NextRequest,
    pathname: string,
    search: string,
) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = '/auth/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('next', `${pathname}${search}`);

    return NextResponse.redirect(loginUrl);
}

function rewriteToPortal(
    request: NextRequest,
    portalPath: string,
) {
    const url = request.nextUrl.clone();

    if (!url.pathname.startsWith(portalPath)) {
        url.pathname =
            `${portalPath}${url.pathname === '/' ? '' : url.pathname}`;
    }

    return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
    const token = request.cookies.get('session_access_token')?.value;

    const { pathname, search } = request.nextUrl;
    const hostname = request.headers.get('host')?.split(':')[0];

    const isTenantPortal =
        hostname === process.env.NEXT_PUBLIC_TENANT_PORTAL_HOST;

    const isLandlordPortal =
        hostname === process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST;

    const isMainSite =
        hostname === process.env.NEXT_PUBLIC_MAIN_SITE_HOST;

    const isAdminPortal =
        hostname === process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST;

    // PUBLIC WEBSITE
    if (isMainSite) {
        return NextResponse.next();
    }

    // PUBLIC ROUTES
    if (
        authRoutes.some(route => pathname.startsWith(route)) ||
        publicRoutes.some(route => pathname.startsWith(route))
    ) {
        return NextResponse.next();
    }

    // ALL PORTAL ROUTES REQUIRE AN AUTHENTICATED SESSION
    if (!token) {
        return redirectToLogin(request, pathname, search);
    }

    // TENANT PORTAL
    if (isTenantPortal) {
        return rewriteToPortal(request, '/tenant-portal');
    }

    // LANDLORD PORTAL
    if (isLandlordPortal) {
        return rewriteToPortal(request, '/landlord-portal');
    }

    // ADMIN PORTAL
    if (isAdminPortal) {
        return rewriteToPortal(request, '/admin');
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};