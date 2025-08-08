import { RegisterRequest } from "@/lib/services/api/types";
import { makeRequest } from "./base";
import { JsonApiRequest } from "@/types/json-api";

export const register = (payload: JsonApiRequest<RegisterRequest>) => {
    return makeRequest('/api/v1/account/register', 'POST', payload);
}