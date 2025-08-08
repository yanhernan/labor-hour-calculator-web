const defaultHeaders = new Headers({
    'Content-Type': 'application/json',
});


export const setHeaders = (headers: Record<string, string>) => {
    defaultHeaders.set('Authorization', `Bearer ${headers.Authorization}`);
}

export const makeRequest = async (endpoint: string, method: string = 'GET', payload: any = null, headers: Record<string, string> = {}, raw: boolean = false): Promise<any> => {
    const requestHeaders = new Headers(defaultHeaders);
    Object.entries(headers).forEach(([key, value]) => {
        requestHeaders.set(key, value);
    });

    const response = await fetch(endpoint, {
        method,
        body: payload ? JSON.stringify(payload) : null,
        headers,
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return raw ? response : response.json();
}

export default makeRequest;