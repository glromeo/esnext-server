/*
 *  MIT License
 *
 *  Copyright (c) 2021 Gianluca Romeo
 *  Copyright (c) 2019 Medley
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

import {Handler, HttpVersion, Req, Res} from "./handler";

/***********************************************************************************************************************
 ██████╗  ██████╗ ██╗   ██╗████████╗███████╗██████╗
 ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ██████╔╝
 ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ██╔══██╗
 ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██║  ██║
 ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝
 ***********************************************************************************************************************/

export type Routes = Record<string, Node>;

export type Node = {
    fragment: string
    children: Routes | null
    handlers: Handlers | null
    variable: Variable | null
    wildcard: Handlers | null
}

export type Handlers = Record<HttpMethod, Handler<HttpVersion>>;

export enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS",
}

export type Variable = {
    name: string
    child: Node | null
    handlers: Handlers | null
}

export class Router {

    rootNode: Node;

    constructor() {
        this.rootNode = emptyNode("/");
    }

    createStore(): Handlers {
        return Object.create(null);
    }

    register(path: string): Handlers {

        const isWildcard = path.endsWith("*");
        if (isWildcard) {
            path = path.slice(0, -1);
        }

        const regExp = /(?<fragment>\/[^:]*)(?<variable>:[^/]+)?/g;
        let match = regExp.exec(path);
        let node: Node | Variable = this.rootNode;
        while (match) {
            let {
                fragment,
                variable
            } = match.groups!;

            if (fragment) for (let l = 0; true; ++l) {

                if (l === fragment.length) {
                    if (l < node.fragment.length) {
                        sliceNode(node, fragment, l);
                    }
                    break;
                }

                if (l === node.fragment.length) {
                    const cc = fragment.charAt(l);
                    if (node.children === null) {
                        node.children = Object.create(null) as Routes;
                    } else if (node.children[cc] !== undefined) {
                        node = node.children[cc]!;
                        fragment = fragment.slice(l);
                        l = 0;
                        continue;
                    }
                    const child = emptyNode(fragment.slice(l));
                    node.children[cc] = child;
                    node = child;
                    break;
                }

                if (fragment[l] !== node.fragment[l]) {
                    node = splitNode(node, fragment, l);
                    break;
                }
            }

            match = regExp.exec(path);

            if (variable) {
                const name = variable.slice(1);
                if (node.variable === null) {
                    node.variable = {
                        name,
                        child: null,
                        handlers: null
                    };
                } else if (node.variable.name !== name) {
                    throw new Error(
                        `Cannot create route "${path}" with variable "${name}", ` +
                        `a route already exists with a different variable name "${node.variable.name}" ` +
                        `in the same location`
                    );
                }

                if (match) {
                    if (node.variable.child === null) {
                        node.variable.child = emptyNode(match.groups!.fragment);
                    }
                    node = node.variable.child;
                } else {
                    node = node.variable;
                    break;
                }
            }
        }

        if (isWildcard) {
            node = node as Node;
            if (node.wildcard === null) {
                node.wildcard = this.createStore();
            }
            return node.wildcard;
        }

        if (node.handlers === null) {
            node.handlers = this.createStore();
        }

        return node.handlers;
    }

    find(url: string) {
        if (url === "" || url[0] !== "/") {
            return null;
        }

        const queryIndex = url.indexOf("?");
        const urlLength = queryIndex >= 0 ? queryIndex : url.length;

        return matchRoute(url, urlLength, this.rootNode, 0);
    }

    get<V extends HttpVersion>(path: string, handler: Handler<V>) {
        Object.defineProperty(this.register(path), HttpMethod.GET, {value: handler});
    }

    put<V extends HttpVersion>(path: string, handler: Handler<V>) {
        Object.defineProperty(this.register(path), HttpMethod.PUT, {value: handler});
    }

    delete<V extends HttpVersion>(path: string, handler: Handler<V>) {
        Object.defineProperty(this.register(path), HttpMethod.DELETE, {value: handler});
    }

    post<V extends HttpVersion>(path: string, handler: Handler<V>) {
        Object.defineProperty(this.register(path), HttpMethod.POST, {value: handler});
    }

    head<V extends HttpVersion>(path: string, handler: Handler<V>) {
        Object.defineProperty(this.register(path), HttpMethod.HEAD, {value: handler});
    }

    options<V extends HttpVersion>(path: string, handler: Handler<V>) {
        Object.defineProperty(this.register(path), HttpMethod.OPTIONS, {value: handler});
    }

    use<V extends HttpVersion>(path: string, handler: Handler<V>) {
        Object.defineProperty(this.register(path), HttpMethod.GET, {value: handler});
        Object.defineProperty(this.register(path), HttpMethod.PUT, {value: handler});
        Object.defineProperty(this.register(path), HttpMethod.DELETE, {value: handler});
        Object.defineProperty(this.register(path), HttpMethod.POST, {value: handler});
        Object.defineProperty(this.register(path), HttpMethod.HEAD, {value: handler});
        Object.defineProperty(this.register(path), HttpMethod.OPTIONS, {value: handler});
    }

    route<V extends HttpVersion>(req: Req<V>, res: Res<V>) {
        const found = req.url && this.find(req.url);
        if (found) {
            const {handlers, params} = found;
            const handler = handlers[req.method as HttpMethod] as Handler<V>;
            handler(req, res, params);
        }
    }

    debugTree() {
        return require("object-treeify")(debugNode(this.rootNode)).replace(/^.{3}/gm, "");
    }

}

function sliceNode(node: Node, fragment: string, index: number): void {
    const added = {...node, fragment: node.fragment.slice(index)};
    node.fragment = fragment;
    node.children = {
        [added.fragment.charAt(0)]: added
    };
    node.handlers = null;
    node.variable = null;
    node.wildcard = null;
}

function splitNode(node: Node, fragment: string, index: number): Node {
    const existing = {...node, fragment: node.fragment.slice(index)};
    const added = emptyNode(fragment.slice(index));
    node.fragment = node.fragment.slice(0, index);
    node.children = {
        [existing.fragment.charAt(0)]: existing,
        [added.fragment.charAt(0)]: added
    };
    node.handlers = null;
    node.variable = null;
    node.wildcard = null;
    return added;
}

function emptyNode(fragment: string): Node {
    return {
        fragment,
        children: null,
        handlers: null,
        variable: null,
        wildcard: null
    };
}

/***********************************************************************************************************************
 ███╗   ███╗ █████╗ ████████╗ ██████╗██╗  ██╗    ██████╗  ██████╗ ██╗   ██╗████████╗███████╗
 ████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██║  ██║    ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝
 ██╔████╔██║███████║   ██║   ██║     ███████║    ██████╔╝██║   ██║██║   ██║   ██║   █████╗
 ██║╚██╔╝██║██╔══██║   ██║   ██║     ██╔══██║    ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝
 ██║ ╚═╝ ██║██║  ██║   ██║   ╚██████╗██║  ██║    ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗
 ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝
 ***********************************************************************************************************************/

export type MatchResult = { handlers: Handlers, params: PathVariables };
export type PathVariables = Record<string, string>;

function matchRoute(url: string, urlLength: number, node: Node, startIndex: number): null | MatchResult {
    const {fragment} = node;
    const fragmentLength = fragment.length;
    const fragmentEndIndex = startIndex + fragmentLength;

    if (fragmentLength > 1) {
        if (fragmentEndIndex > urlLength) {
            return null;
        }
        if (fragmentLength < 15) {
            for (let f = 1, u = startIndex + 1; f < fragmentLength; ++f, ++u) {
                if (fragment[f] !== url[u]) {
                    return null;
                }
            }
        } else if (url.indexOf(fragment, startIndex) !== startIndex) {
            return null;
        }
    }

    startIndex = fragmentEndIndex;

    if (startIndex === urlLength) {
        if (node.handlers !== null) {
            return {
                handlers: node.handlers,
                params: {}
            };
        }
        if (node.wildcard !== null) {
            return {
                handlers: node.wildcard,
                params: {"*": ""}
            };
        }
        return null;
    }

    if (node.children !== null) {
        const child = node.children[url.charAt(startIndex)];
        if (child !== undefined) {
            const route = matchRoute(url, urlLength, child, startIndex);
            if (route !== null) {
                return route;
            }
        }
    }

    if (node.variable !== null) {
        const variable = node.variable;
        const slashIndex = url.indexOf("/", startIndex);

        if (slashIndex >= startIndex && slashIndex < urlLength) {
            if (variable.child !== null && slashIndex !== startIndex) {
                const route = matchRoute(url, urlLength, variable.child, slashIndex);
                if (route !== null) {
                    route.params[variable.name] = url.slice(startIndex, slashIndex);
                    return route;
                }
            }
        } else if (variable.handlers !== null) {
            const params: PathVariables = {};
            params[variable.name] = url.slice(startIndex, urlLength);
            return {
                handlers: variable.handlers,
                params
            };
        }
    }

    if (node.wildcard !== null) {
        return {
            handlers: node.wildcard,
            params: {
                "*": url.slice(startIndex, urlLength)
            }
        };
    }

    return null;
}


function debugNode(node: Node): any {
    if (node.handlers === null && node.children === null) { // Can compress output better
        if (node.variable === null) { // There is only a wildcard handlers
            return {[node.fragment + "* (s)"]: null};
        }

        if (node.wildcard === null) { // There is only a parametric child
            if (node.variable.handlers === null) {
                return {
                    [node.fragment + ":" + node.variable.name]:
                        debugNode(node.variable.child!)
                };
            }

            if (node.variable.child === null) {
                return {
                    [node.fragment + ":" + node.variable.name + " (s)"]: null
                };
            }
        }
    }

    const childRoutes: Record<string, Node | null> = {};

    if (node.children !== null) {
        for (const childNode of Object.values(node.children)) {
            Object.assign(childRoutes, debugNode(childNode));
        }
    }

    if (node.variable !== null) {
        const {variable} = node;
        const label = ":" + variable.name + debugHandlers(variable.handlers);

        childRoutes[label] = variable.child === null
            ? null
            : debugNode(variable.child);
    }

    if (node.wildcard !== null) {
        childRoutes["* (s)"] = null;
    }

    return {
        [node.fragment + debugHandlers(node.handlers)]: childRoutes
    };
}

function debugHandlers(handlers: Handlers | null) {
    return handlers === null ? "" : " (s)";
}
