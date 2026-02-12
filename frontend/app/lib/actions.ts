'use server';

import { cookies } from "next/headers";

const DEBUG = process.env.NODE_ENV !== 'production';

export async function handleLogin(userId: string, accessToken: string, refreshToken: string) {
    const requestCookies = await cookies();

    requestCookies.set('session_userid', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
    });

    requestCookies.set('session_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60, //  1 hour
        path: '/'
    });

    requestCookies.set('session_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
    });

    if (DEBUG) {
        console.log('handleLogin: Access token set:', accessToken);
        console.log('handleLogin: Refresh token set:', refreshToken);
    }
}

/** Clears all auth cookies */
export async function resetAuthCookies() {
    const requestCookies = await cookies();
    requestCookies.set('session_userid', '');
    requestCookies.set('session_access_token', '');
    requestCookies.set('session_refresh_token', '');
    
    if (DEBUG) console.log('Auth cookies reset');
}

/** Refresh access token using the refresh token */
export async function handleRefresh() {
    if (DEBUG) console.log('Refreshing tokens...');

    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
        if (DEBUG) console.log('No refresh token available, skipping refresh.');
        return null; // stop if no refresh token
    }

    if (DEBUG) console.log('Refresh token found:', refreshToken);

    try {
        const response = await fetch('http://localhost:8000/api/auth/token/refresh/', {
            method: 'POST',
            body: JSON.stringify({ refresh: refreshToken }),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        const json = await response.json();

        if (DEBUG) console.log('Refresh response:', json);

        if (json.access) {
            const requestCookies = await cookies();
            const accessToken = json.access;

            requestCookies.set('session_access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60, // 1 hour
                path: '/',
            });

            return accessToken;
        } else {
            if (DEBUG) console.log('No access token in refresh response, resetting cookies');
            resetAuthCookies();
            return null;
        }
    } catch (error) {
        if (DEBUG) console.error('Error refreshing token:', error);
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