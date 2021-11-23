import { Handler, HttpVersion, Req, Res } from "./handler";
export declare type Routes = Record<string, Node>;
export declare type Node = {
    fragment: string;
    children: Routes | null;
    handlers: Handlers | null;
    variable: Variable | null;
    wildcard: Handlers | null;
};
export declare type Handlers = Record<HttpMethod, Handler<HttpVersion>>;
export declare enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS"
}
export declare type Variable = {
    name: string;
    child: Node | null;
    handlers: Handlers | null;
};
export declare class Router {
    rootNode: Node;
    constructor();
    createStore(): Handlers;
    register(path: string): Handlers;
    find(url: string): MatchResult | null;
    get<V extends HttpVersion>(path: string, handler: Handler<V>): void;
    put<V extends HttpVersion>(path: string, handler: Handler<V>): void;
    delete<V extends HttpVersion>(path: string, handler: Handler<V>): void;
    post<V extends HttpVersion>(path: string, handler: Handler<V>): void;
    head<V extends HttpVersion>(path: string, handler: Handler<V>): void;
    options<V extends HttpVersion>(path: string, handler: Handler<V>): void;
    use<V extends HttpVersion>(path: string, handler: Handler<V>): void;
    route<V extends HttpVersion>(req: Req<V>, res: Res<V>): void;
    debugTree(): any;
}
export declare type MatchResult = {
    handlers: Handlers;
    params: PathVariables;
};
export declare type PathVariables = Record<string, string>;
