import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authRoutes = ['/auth/login', '/auth/register'];

const publicInvitationRoutes = ['/accept-invitation'];

export function proxy(request: NextRequest) {
    const token = request.cookies.get('session_access_token')?.value;

    const { pathname, search } = request.nextUrl;
    const hostname = request.headers.get('host')?.split(':')[0];

    const isTenantPortal = hostname === process.env.NEXT_PUBLIC_TENANT_PORTAL_HOST;
    const isLandlordPortal = hostname === process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST;
    const isMainSite = hostname === process.env.NEXT_PUBLIC_MAIN_SITE_HOST;
    const isAdminPortal = hostname === process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST;

    // PUBLIC WEBSITE
    if (isMainSite) {
        return NextResponse.next();
    }

    // AUTH ROUTES
    if (authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // TENANT PORTAL
    if (isTenantPortal) {
        const isPublicTenantRoute = publicInvitationRoutes.some(route => pathname.startsWith(route));

        if (isPublicTenantRoute) {
            return NextResponse.next();
        }

        if (!token) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/auth/login';
            loginUrl.search = '';
            loginUrl.searchParams.set('next', `${pathname}${search}`);
            return NextResponse.redirect(loginUrl);
        }

        if (!pathname.startsWith('/tenant-portal')) {
            const url = request.nextUrl.clone();
            url.pathname = `/tenant-portal${pathname === '/' ? '' : pathname}`;
            return NextResponse.rewrite(url);
        }

        return NextResponse.next();
    }

    // LANDLORD PORTAL
    if (isLandlordPortal) {
        const isPublicInvitationRoute = publicInvitationRoutes.some(route => pathname.startsWith(route));

        if (isPublicInvitationRoute) {
            return NextResponse.next();
        }
        if (!token) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/auth/login';
            loginUrl.search = '';
            loginUrl.searchParams.set('next', `${pathname}${search}`);
            return NextResponse.redirect(loginUrl);
        }

        if (!pathname.startsWith('/landlord-portal')) {
            const url = request.nextUrl.clone();
            url.pathname = `/landlord-portal${pathname === '/' ? '' : pathname}`;
            return NextResponse.rewrite(url);
        }

        return NextResponse.next();
    }

    // ADMIN PORTAL
    if (isAdminPortal) {
        if (!token) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/auth/login';
            loginUrl.search = '';
            loginUrl.searchParams.set('next', `${pathname}${search}`);
            return NextResponse.redirect(loginUrl);
        }

        if (!pathname.startsWith('/admin')) {
            const url = request.nextUrl.clone();
            url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
            return NextResponse.rewrite(url);
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};