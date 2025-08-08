export interface JsonApiDataResponse<T> {
    id: string | number;
    type: string;
    attributes: T;
}

export interface JsonApiDataRequest<T> {
    type: string;
    attributes: T;
}

export interface JsonApiRequest<T> {
    data: JsonApiDataRequest<T> | JsonApiDataRequest<T>[];
}

export interface JsonApiResponse<T> {
    data: JsonApiDataResponse<T> | JsonApiDataResponse<T>[];
}