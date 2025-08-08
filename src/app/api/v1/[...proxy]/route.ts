import { envConfig } from "@/lib/env/config";
import { NextRequest } from "next/server";

const handler = async (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    const { searchParams } = request.nextUrl;
    const { method } = request;
    const headers = new Headers(request.headers);
    headers.delete('host');
    const requestBody = request.body ? await request.text() : null;
    const url = new URL(pathname, envConfig.primaryApiUrl);

    url.search = searchParams.toString();

    const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
    });

    return response;
};

export { handler as GET, handler as POST };