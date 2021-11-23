"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = exports.HttpMethod = void 0;
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["HEAD"] = "HEAD";
    HttpMethod["OPTIONS"] = "OPTIONS";
})(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));
class Router {
    constructor() {
        this.rootNode = emptyNode("/");
    }
    createStore() {
        return Object.create(null);
    }
    register(path) {
        const isWildcard = path.endsWith("*");
        if (isWildcard) {
            path = path.slice(0, -1);
        }
        const regExp = /(?<fragment>\/[^:]*)(?<variable>:[^/]+)?/g;
        let match = regExp.exec(path);
        let node = this.rootNode;
        while (match) {
            let { fragment, variable } = match.groups;
            if (fragment)
                for (let l = 0; true; ++l) {
                    if (l === fragment.length) {
                        if (l < node.fragment.length) {
                            sliceNode(node, fragment, l);
                        }
                        break;
                    }
                    if (l === node.fragment.length) {
                        const cc = fragment.charAt(l);
                        if (node.children === null) {
                            node.children = Object.create(null);
                        }
                        else if (node.children[cc] !== undefined) {
                            node = node.children[cc];
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
                }
                else if (node.variable.name !== name) {
                    throw new Error(`Cannot create route "${path}" with variable "${name}", ` +
                        `a route already exists with a different variable name "${node.variable.name}" ` +
                        `in the same location`);
                }
                if (match) {
                    if (node.variable.child === null) {
                        node.variable.child = emptyNode(match.groups.fragment);
                    }
                    node = node.variable.child;
                }
                else {
                    node = node.variable;
                    break;
                }
            }
        }
        if (isWildcard) {
            node = node;
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
    find(url) {
        if (url === "" || url[0] !== "/") {
            return null;
        }
        const queryIndex = url.indexOf("?");
        const urlLength = queryIndex >= 0 ? queryIndex : url.length;
        return matchRoute(url, urlLength, this.rootNode, 0);
    }
    get(path, handler) {
        this.register(path)[HttpMethod.GET] = handler;
    }
    put(path, handler) {
        this.register(path)[HttpMethod.PUT] = handler;
    }
    delete(path, handler) {
        this.register(path)[HttpMethod.DELETE] = handler;
    }
    post(path, handler) {
        this.register(path)[HttpMethod.POST] = handler;
    }
    head(path, handler) {
        this.register(path)[HttpMethod.HEAD] = handler;
    }
    options(path, handler) {
        this.register(path)[HttpMethod.OPTIONS] = handler;
    }
    use(path, handler) {
        const handlers = this.register(path);
        handlers[HttpMethod.GET] = handler;
        handlers[HttpMethod.PUT] = handler;
        handlers[HttpMethod.DELETE] = handler;
        handlers[HttpMethod.POST] = handler;
        handlers[HttpMethod.HEAD] = handler;
        handlers[HttpMethod.OPTIONS] = handler;
    }
    route(req, res) {
        const found = req.url && this.find(req.url);
        if (found) {
            const { handlers, params } = found;
            const handler = handlers[req.method];
            handler(req, res, params);
        }
    }
    debugTree() {
        return require("object-treeify")(debugNode(this.rootNode)).replace(/^.{3}/gm, "");
    }
}
exports.Router = Router;
function sliceNode(node, fragment, index) {
    const added = { ...node, fragment: node.fragment.slice(index) };
    node.fragment = fragment;
    node.children = {
        [added.fragment.charAt(0)]: added
    };
    node.handlers = null;
    node.variable = null;
    node.wildcard = null;
}
function splitNode(node, fragment, index) {
    const existing = { ...node, fragment: node.fragment.slice(index) };
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
function emptyNode(fragment) {
    return {
        fragment,
        children: null,
        handlers: null,
        variable: null,
        wildcard: null
    };
}
function matchRoute(url, urlLength, node, startIndex) {
    const { fragment } = node;
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
        }
        else if (url.indexOf(fragment, startIndex) !== startIndex) {
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
                params: { "*": "" }
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
        }
        else if (variable.handlers !== null) {
            const params = {};
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
function debugNode(node) {
    if (node.handlers === null && node.children === null) {
        if (node.variable === null) {
            return { [node.fragment + "* (s)"]: null };
        }
        if (node.wildcard === null) {
            if (node.variable.handlers === null) {
                return {
                    [node.fragment + ":" + node.variable.name]: debugNode(node.variable.child)
                };
            }
            if (node.variable.child === null) {
                return {
                    [node.fragment + ":" + node.variable.name + " (s)"]: null
                };
            }
        }
    }
    const childRoutes = {};
    if (node.children !== null) {
        for (const childNode of Object.values(node.children)) {
            Object.assign(childRoutes, debugNode(childNode));
        }
    }
    if (node.variable !== null) {
        const { variable } = node;
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
function debugHandlers(handlers) {
    return handlers === null ? "" : " (s)";
}
//# sourceMappingURL=router.js.map