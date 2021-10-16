import { Handler } from "./server";
export declare type Routes = Record<string, Node>;
export declare type Node = {
    fragment: string;
    children: Routes | null;
    handlers: Handlers | null;
    variable: Variable | null;
    wildcard: Handlers | null;
};
export declare type Handlers = Record<HttpMethod | "use", Handler>;
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
    get(path: string, handler: Handler): void;
    debugTree(): any;
}
export declare type MatchResult = {
    handlers: Handlers;
    params: Parameters;
};
export declare type Parameters = Record<string, string>;
