export interface JwtPayload {
    id: number;
    email: string;
    username: string; //cambiar por name
    exp: number;
    iat?: number;
}
