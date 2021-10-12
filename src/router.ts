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

type Routes = Record<string, RouterNode>;

export type RouterNode = {
    fragment: string
    children: Routes | null
    store: Record<string, any> | null
    variable: PathVar | null
    wildcard: Record<string, any> | null
}

export type PathVar = {
    name: string
    child: RouterNode | null
    store: Record<string, any> | null
}

function sliceNode(node: RouterNode, fragment: string, index: number): void {
    const added = {...node, fragment: node.fragment.slice(index)};
    node.fragment = fragment;
    node.children = {
        [added.fragment.charAt(0)]: added
    }
    node.store = null;
    node.variable = null;
    node.wildcard = null;
}

function splitNode(node: RouterNode, fragment: string, index: number): RouterNode {
    const existing = {...node, fragment: node.fragment.slice(index)};
    const added = emptyNode(fragment.slice(index));
    node.fragment = node.fragment.slice(0, index);
    node.children = {
        [existing.fragment.charAt(0)]: existing,
        [added.fragment.charAt(0)]: added
    }
    node.store = null;
    node.variable = null;
    node.wildcard = null;
    return added;
}

function emptyNode(fragment: string) {
    return {
        fragment,
        children: null,
        store: null,
        variable: null,
        wildcard: null
    };
}

export class Router {

    rootNode: RouterNode;

    constructor() {
        this.rootNode = emptyNode("/");
    }

    createStore() {
        return Object.create(null);
    }

    register(path: string) {

        const endsWithWildcard = path.endsWith("*");
        if (endsWithWildcard) {
            path = path.slice(0, -1);
        }

        let node: RouterNode | PathVar = this.rootNode;

        const regExp = /(?<fragment>\/[^:]*)(?<variable>:[^/]+)?/g;
        let match = regExp.exec(path);
        while (match) {
            let {
                fragment,
                variable
            } = match.groups!;

            if (fragment) {
                let j = 0;
                while (true) {
                    node = node as RouterNode;

                    if (j === fragment.length) {
                        if (j < node.fragment.length) sliceNode(node, fragment, j);
                        break;
                    }

                    if (j === node.fragment.length) {
                        const cc = fragment.charAt(j);
                        if (node.children === null) {
                            node.children = Object.create(null) as Routes;
                        } else if (node.children[cc] !== undefined) {
                            node = node.children[cc]!;
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

        if (endsWithWildcard) {
            node = node as RouterNode;
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

    find(url: string) {
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

type PathParams = Record<string, string>;

function matchRoute(url: string, urlLength: number, node: RouterNode, startIndex: number): null | { store: Record<string, any>, params: PathParams } {
    const {fragment} = node;
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
        } else if (url.indexOf(fragment, startIndex) !== startIndex) {
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
        } else if (variable.store !== null) {
            const params: PathParams = {};
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

function debugNode(node: RouterNode): any {
    if (node.store === null && node.children === null) { // Can compress output better
        if (node.variable === null) { // There is only a wildcard store
            return {[node.fragment + "* (s)"]: null};
        }

        if (node.wildcard === null) { // There is only a parametric child
            if (node.variable.store === null) {
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

    const childRoutes: Record<string, RouterNode | null> = {};

    if (node.children !== null) {
        for (const childNode of Object.values(node.children)) {
            Object.assign(childRoutes, debugNode(childNode));
        }
    }

    if (node.variable !== null) {
        const {variable} = node;
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

function debugStore(store: Record<string, any> | null) {
    return store === null ? "" : " (s)";
}
