'use server';

import apiService from "@/app/services/apiService";
import { cookies } from "next/headers";

const accessTokenMaxAge =
    process.env.NODE_ENV === 'production'
        ? 60 * 60 * 1   // 1 hour in production
        : 60 * 60 * 24; // 24 hours in development

const COOKIE_DOMAIN = 
    process.env.NODE_ENV === 'production'
        ? '.rentwise.com'
        : '.rentwise.localhost';


export async function handleLogin(
    userId: string, 
    accessToken: string, 
    refreshToken: string, 
    portalAccess: { landlord: boolean; tenant: boolean; admin: boolean }
) {
    const requestCookies = await cookies();

    requestCookies.set('session_userid', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        domain: COOKIE_DOMAIN
    });

    requestCookies.set('session_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: accessTokenMaxAge,
        path: '/',
        domain: COOKIE_DOMAIN
    });

    requestCookies.set('session_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        domain: COOKIE_DOMAIN
    });

    requestCookies.set('session_portal_access', JSON.stringify(portalAccess), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        domain: COOKIE_DOMAIN,
    });

    console.log('handleLogin: User ID set:', userId);
    console.log('handleLogin: Access token set:', accessToken);
    console.log('handleLogin: Refresh token set:', refreshToken);
    console.log('handleLogin: Portal access set:', portalAccess);
}

/** Clears all auth cookies */
export async function resetAuthCookies() {
    const requestCookies = await cookies();

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        domain: COOKIE_DOMAIN
    };

    requestCookies.set('session_userid', '', options);
    requestCookies.set('session_access_token', '', options);
    requestCookies.set('session_refresh_token', '', options);
    requestCookies.set('session_portal_access', '', options);

    console.log('Auth cookies reset');
}

/** Refresh access token using the refresh token */
export async function handleRefresh() {
    console.log('Refreshing tokens...');

    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
        console.log('No refresh token available, skipping refresh.');
        return null;
    }

    console.log('Refresh token found:', refreshToken);

    try {
        const response = await apiService.post(`/api/auth/token/refresh/`, {
            refresh: refreshToken,
        });

        console.log('Refresh response:', response);

        const requestCookies = await cookies();
        const accessToken = response.access;

        requestCookies.set('session_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60,
            path: '/',
            domain: COOKIE_DOMAIN
        });

        return accessToken;
    } catch (error) {
        console.error('Error refreshing token:', error);
        resetAuthCookies();
        return null;
    }
}

/** Get access token; triggers refresh if missing */
export async function getAccessToken() {
    const requestCookies = await cookies();
    let accessToken = requestCookies.get('session_access_token')?.value;

    if (!accessToken) {
        accessToken = await handleRefresh();
    }

    return accessToken;
}

/** Get refresh token from cookies */
export async function getRefreshToken() {
    const requestCookies = await cookies();
    return requestCookies.get('session_refresh_token')?.value;
}

export async function getPortalAccess(): Promise<{ 
    landlord: boolean; 
    tenant: boolean; 
    admin: boolean 
}> {
    const response = await apiService.get("/api/auth/me/");
    return response.portal_access;
}