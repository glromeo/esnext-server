"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
function sliceNode(node, fragment, index) {
    const added = { ...node, fragment: node.fragment.slice(index) };
    node.fragment = fragment;
    node.children = {
        [added.fragment.charAt(0)]: added
    };
    node.store = null;
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
    node.store = null;
    node.variable = null;
    node.wildcard = null;
    return added;
}
function emptyNode(fragment) {
    return {
        fragment,
        children: null,
        store: null,
        variable: null,
        wildcard: null
    };
}
class Router {
    constructor() {
        this.rootNode = emptyNode("/");
    }
    createStore() {
        return Object.create(null);
    }
    register(path) {
        const endsWithWildcard = path.endsWith("*");
        if (endsWithWildcard) {
            path = path.slice(0, -1);
        }
        let node = this.rootNode;
        const regExp = /(?<fragment>\/[^:]*)(?<variable>:[^/]+)?/g;
        let match = regExp.exec(path);
        while (match) {
            let { fragment, variable } = match.groups;
            if (fragment) {
                let j = 0;
                while (true) {
                    node = node;
                    if (j === fragment.length) {
                        if (j < node.fragment.length)
                            sliceNode(node, fragment, j);
                        break;
                    }
                    if (j === node.fragment.length) {
                        const cc = fragment.charAt(j);
                        if (node.children === null) {
                            node.children = Object.create(null);
                        }
                        else if (node.children[cc] !== undefined) {
                            node = node.children[cc];
                            fragment = fragment.slice(j);
                            j = 0;
                            continue;
                        }
                        const child = emptyNode(fragment.slice(j));
                        node.children[cc] = child;
                        node = child;
                        break;
                    }
                    if (fragment[j] !== node.fragment[j]) {
                        node = splitNode(node, fragment, j);
                        break;
                    }
                    ++j;
                }
            }
            match = regExp.exec(path);
            if (variable) {
                const name = variable.slice(1);
                if (node.variable === null) {
                    node.variable = {
                        name,
                        child: null,
                        store: null
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
        if (endsWithWildcard) {
            node = node;
            if (node.wildcard === null) {
                node.wildcard = this.createStore();
            }
            return node.wildcard;
        }
        if (node.store === null) {
            node.store = this.createStore();
        }
        return node.store;
    }
    find(url) {
        if (url === "" || url[0] !== "/") {
            return null;
        }
        const queryIndex = url.indexOf("?");
        const urlLength = queryIndex >= 0 ? queryIndex : url.length;
        return matchRoute(url, urlLength, this.rootNode, 0);
    }
    debugTree() {
        return require("object-treeify")(debugNode(this.rootNode)).replace(/^.{3}/gm, "");
    }
}
exports.Router = Router;
function matchRoute(url, urlLength, node, startIndex) {
    const { fragment } = node;
    const fragmentLength = fragment.length;
    const fragmentEndIndex = startIndex + fragmentLength;
    if (fragmentLength > 1) {
        if (fragmentEndIndex > urlLength) {
            return null;
        }
        if (fragmentLength < 15) {
            for (let i = 1, j = startIndex + 1; i < fragmentLength; ++i, ++j) {
                if (fragment[i] !== url[j]) {
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
        if (node.store !== null) {
            return {
                store: node.store,
                params: {}
            };
        }
        if (node.wildcard !== null) {
            return {
                store: node.wildcard,
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
        else if (variable.store !== null) {
            const params = {};
            params[variable.name] = url.slice(startIndex, urlLength);
            return {
                store: variable.store,
                params
            };
        }
    }
    if (node.wildcard !== null) {
        return {
            store: node.wildcard,
            params: {
                "*": url.slice(startIndex, urlLength)
            }
        };
    }
    return null;
}
function debugNode(node) {
    if (node.store === null && node.children === null) {
        if (node.variable === null) {
            return { [node.fragment + "* (s)"]: null };
        }
        if (node.wildcard === null) {
            if (node.variable.store === null) {
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
        const label = ":" + variable.name + debugStore(variable.store);
        childRoutes[label] = variable.child === null
            ? null
            : debugNode(variable.child);
    }
    if (node.wildcard !== null) {
        childRoutes["* (s)"] = null;
    }
    return {
        [node.fragment + debugStore(node.store)]: childRoutes
    };
}
function debugStore(store) {
    return store === null ? "" : " (s)";
}
//# sourceMappingURL=router.js.map