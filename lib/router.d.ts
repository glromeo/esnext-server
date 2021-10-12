declare type Routes = Record<string, RouterNode>;
export declare type RouterNode = {
    fragment: string;
    children: Routes | null;
    store: Record<string, any> | null;
    variable: PathVar | null;
    wildcard: Record<string, any> | null;
};
export declare type PathVar = {
    name: string;
    child: RouterNode | null;
    store: Record<string, any> | null;
};
export declare class Router {
    rootNode: RouterNode;
    constructor();
    createStore(): any;
    register(path: string): Record<string, any> | null;
    find(url: string): {
        store: Record<string, any>;
        params: PathParams;
    } | null;
    debugTree(): any;
}
declare type PathParams = Record<string, string>;
export {};
