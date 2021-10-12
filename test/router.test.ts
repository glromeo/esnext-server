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

import "mocha-toolkit";
import {Router} from "../src/router";

function createRouter(paths) {
    const router = new Router();
    for (const path of paths) {
        const store = router.register(path);
        store.path = path;
    }
    return router;
}

function expectedRoute(path, params = {}) {
    return {
        store: Object.assign(Object.create(null), {path}),
        params,
    };
}

describe("router", function () {

    describe(".register()", () => {

        it("returns the store created by the storeFactory (default storeFactory)", () => {
            const router = new Router();

            const rootStore = router.register("/");
            assert.deepEqual(rootStore, Object.create(null));
            assert.equal(router.register("/"), rootStore);

            const userStore = router.register("/user/:id");
            assert.deepEqual(userStore, Object.create(null));
            assert.equal(router.register("/user/:id"), userStore);

            const staticStore = router.register("/static/*");
            assert.deepEqual(staticStore, Object.create(null));
            assert.equal(router.register("/static/*"), staticStore);

            assert.notEqual(rootStore, userStore);
            assert.notEqual(userStore, staticStore);
        });

        it("returns the store created by the storeFactory (custom storeFactory)", () => {
            const router = new Router();

            router.createStore = () => Symbol("route");

            const rootStore = router.register("/");
            assert.equal(typeof rootStore, "symbol");
            assert.equal(router.register("/"), rootStore);

            const userStore = router.register("/user/:id");
            assert.equal(typeof userStore, "symbol");
            assert.equal(router.register("/user/:id"), userStore);

            const staticStore = router.register("/static/*");
            assert.equal(typeof staticStore, "symbol");
            assert.equal(router.register("/static/*"), staticStore);

            assert.notEqual(rootStore, userStore);
            assert.notEqual(userStore, staticStore);
        });

    });


    describe(".find()", () => {

        it("returns `null` if the route is not found", () => {
            const router = createRouter([
                "/",
                "/hello/world",
                "/user/:id",
                "/events/:type/subtypes",
                "/static/*"
            ]);

            assert.equal(router.find(""), null);
            assert.equal(router.find("hello/world"), null);
            assert.equal(router.find("/user/"), null);
            assert.equal(router.find("/user/?foo"), null);
            assert.equal(router.find("/events/change"), null);
            assert.equal(router.find("/events/change/"), null);
            assert.equal(router.find("/events/change/sub"), null);
        });

    });


    describe(".debugTree()", () => {

        it("returns a representation of the radix tree as a string", () => {
            const router = createRouter([
                "/",
                "/hello/world",
                "/user/:id",
                "/user/all",
                "/user/all/:or",
                "/user/all/nothing",
                "/user/*",
                "/events/:type/subtypes",
                "/static/*",
                "/posts/:id",
                "/posts/:id/comments",
                "/r/:roomID",
                "/api/:version/status",
                "/api/*"
            ]);
            const str = router.debugTree();
            console.log(str);
            assert.equal(typeof str, "string");
            assert.equal(str[0], "/");
        });

    });

    describe("with static routes", () => {

        it("supports a route at the root URL", () => {
            const router = createRouter(["/"]);
            assert.deepEqual(router.find("/"), expectedRoute("/"));
            assert.equal(router.find("/other/"), null);
        });

        it("supports a route at the root URL while there are other routes", () => {
            const router = createRouter([
                "/",
                "/a",
                "/a/b",
                "/:param",
                "/:param/post",
                "/*",
            ]);
            assert.deepEqual(router.find("/"), expectedRoute("/"));
        });

        it("supports many static paths", () => {
            const router = createRouter([
                "/",
                "/a",
                "/b/",
                "/c",
                "/cd",
                "/d/",
                "/d/e",
                "/hello-world",
                "/hello-there",
                "/hello-things",
                "/verylongroutepath",
                "/static/js",
                "/static/", // Create shorter route second
            ]);

            assert.deepEqual(router.find("/"), expectedRoute("/"));
            assert.deepEqual(router.find("/a"), expectedRoute("/a"));
            assert.deepEqual(router.find("/b/"), expectedRoute("/b/"));
            assert.deepEqual(router.find("/c"), expectedRoute("/c"));
            assert.deepEqual(router.find("/cd"), expectedRoute("/cd"));
            assert.deepEqual(router.find("/d/"), expectedRoute("/d/"));
            assert.deepEqual(router.find("/d/e"), expectedRoute("/d/e"));
            assert.deepEqual(router.find("/hello-world"), expectedRoute("/hello-world"));
            assert.deepEqual(router.find("/hello-there"), expectedRoute("/hello-there"));
            assert.deepEqual(router.find("/hello-things"), expectedRoute("/hello-things"));
            assert.deepEqual(router.find("/verylongroutepath"), expectedRoute("/verylongroutepath"));
            assert.deepEqual(router.find("/static/js"), expectedRoute("/static/js"));
            assert.deepEqual(router.find("/static/"), expectedRoute("/static/"));

            assert.equal(router.find("/a/"), null);
            assert.equal(router.find("/b"), null);
            assert.equal(router.find("/d"), null);
            assert.equal(router.find("/e"), null);
            assert.equal(router.find("/h"), null);
            assert.equal(router.find("/hello"), null);
            assert.equal(router.find("/hello-"), null);
            assert.equal(router.find("/hello-th"), null);
            assert.equal(router.find("/verylongroutepass"), null);
        });

        it("supports matching URLs with a query string", () => {
            const router = createRouter([
                "/",
                "/a",
                "/b/",
                "/c",
                "/cd",
                "/d/",
                "/d/e",
                "/hello-world",
                "/hello-there",
                "/hello-things",
                "/static/js",
                "/static/",
            ]);

            assert.deepEqual(router.find("/?"), expectedRoute("/"));
            assert.deepEqual(router.find("/a?"), expectedRoute("/a"));
            assert.deepEqual(router.find("/b/?"), expectedRoute("/b/"));
            assert.deepEqual(router.find("/c?"), expectedRoute("/c"));
            assert.deepEqual(router.find("/cd?"), expectedRoute("/cd"));
            assert.deepEqual(router.find("/d/?"), expectedRoute("/d/"));
            assert.deepEqual(router.find("/d/e?"), expectedRoute("/d/e"));
            assert.deepEqual(router.find("/hello-world?"), expectedRoute("/hello-world"));
            assert.deepEqual(router.find("/hello-there?"), expectedRoute("/hello-there"));
            assert.deepEqual(router.find("/hello-things?"), expectedRoute("/hello-things"));
            assert.deepEqual(router.find("/static/js?"), expectedRoute("/static/js"));
            assert.deepEqual(router.find("/static/?foo=bar"), expectedRoute("/static/"));
        });

    });

    describe("with wildcard routes", () => {

        it("supports a wildcard at the root", () => {
            const router = createRouter(["/*"]);

            assert.deepEqual(router.find("/"), expectedRoute("/*", {"*": ""}));
            assert.deepEqual(router.find("/1"), expectedRoute("/*", {"*": "1"}));
            assert.deepEqual(router.find("/123"), expectedRoute("/*", {"*": "123"}));
            assert.deepEqual(router.find("/js/"), expectedRoute("/*", {"*": "js/"}));
            assert.deepEqual(router.find("/js/common.js"), expectedRoute("/*", {"*": "js/common.js"}));
        });

        it("supports a wildcard in a separate path segment", () => {
            const router = createRouter(["/static/*"]);

            assert.deepEqual(router.find("/static/"), expectedRoute("/static/*", {"*": ""}));
            assert.deepEqual(router.find("/static/1"), expectedRoute("/static/*", {"*": "1"}));
            assert.deepEqual(router.find("/static/123"), expectedRoute("/static/*", {"*": "123"}));
            assert.deepEqual(router.find("/static/js/"), expectedRoute("/static/*", {"*": "js/"}));
            assert.deepEqual(router.find("/static/js/common.js"), expectedRoute("/static/*", {"*": "js/common.js"}));

            assert.equal(router.find("/static"), null);
        });

        it("supports matching URLs with a query string", () => {
            const router = createRouter([
                "/*",
                "/static/*",
            ]);

            assert.deepEqual(router.find("/?"), expectedRoute("/*", {"*": ""}));
            assert.deepEqual(router.find("/?foo"), expectedRoute("/*", {"*": ""}));
            assert.deepEqual(router.find("/1?"), expectedRoute("/*", {"*": "1"}));
            assert.deepEqual(router.find("/123?"), expectedRoute("/*", {"*": "123"}));
            assert.deepEqual(router.find("/js/?"), expectedRoute("/*", {"*": "js/"}));
            assert.deepEqual(router.find("/js/common.js?"), expectedRoute("/*", {"*": "js/common.js"}));

            assert.deepEqual(router.find("/static/?"), expectedRoute("/static/*", {"*": ""}));
            assert.deepEqual(router.find("/static/1?"), expectedRoute("/static/*", {"*": "1"}));
            assert.deepEqual(router.find("/static/123?"), expectedRoute("/static/*", {"*": "123"}));
            assert.deepEqual(router.find("/static/js/?"), expectedRoute("/static/*", {"*": "js/"}));
            assert.deepEqual(router.find("/static/js/common.js?"), expectedRoute("/static/*", {"*": "js/common.js"}));
        });

    });

    describe("with parametric routes", () => {

        it("throws if overlapping parameters have different names", () => {
            const router = createRouter([
                "/:subsystem",
                "/user/:id",
                "/user/:id/comment"
            ]);

            assert.throws(() => router.register("/:sub"), /route already exists with a different variable name/);
            assert.throws(() => router.register("/:sub/"), /route already exists with a different variable name/);
            assert.throws(() => router.register("/user/:userID"), /route already exists with a different variable name/);
            assert.throws(() => router.register("/user/:userID/posts"), /route already exists with a different variable name/);
        });

        it("supports a parameter at the root", () => {
            const router = createRouter(["/:id"]);

            assert.deepEqual(router.find("/1"), expectedRoute("/:id", {id: "1"}));
            assert.deepEqual(router.find("/123"), expectedRoute("/:id", {id: "123"}));

            assert.equal(router.find("/"), null, "Parameters cannot be empty");
            assert.equal(router.find("/123/"), null, "Parameters cannot include the path separator");
        });

        it("handles //", () => {
            const router = createRouter(["/:id", "/:id/"]);
            assert.deepEqual(router.find("/"), null);
            assert.deepEqual(router.find("/?"), null);
            assert.deepEqual(router.find("/x"), expectedRoute("/:id", {id: "x"}));
            assert.deepEqual(router.find("//"), null);
        });

        it("supports a parameter at the end of the URL", () => {
            const router = createRouter(["/user/:id"]);

            assert.deepEqual(router.find("/user/1"), expectedRoute("/user/:id", {id: "1"}));
            assert.deepEqual(router.find("/user/123"), expectedRoute("/user/:id", {id: "123"}));

            assert.equal(router.find("/user"), null, "Parameters cannot be empty");
            assert.equal(router.find("/user/123/"), null, "Parameters cannot include the path separator");
        });

        it("supports parameters in the middle of the URL", () => {
            const router = createRouter([
                "/:subsystem/edit",
                "/:subsystem/view",
                "/user/:id/comment",
                "/user/:id/comments"
            ]);

            assert.deepEqual(
                router.find("/1/edit"),
                expectedRoute("/:subsystem/edit", {subsystem: "1"})
            );
            assert.deepEqual(
                router.find("/123/edit"),
                expectedRoute("/:subsystem/edit", {subsystem: "123"})
            );

            assert.deepEqual(
                router.find("/user/1/comment"),
                expectedRoute("/user/:id/comment", {id: "1"})
            );
            assert.deepEqual(
                router.find("/user/123/comments"),
                expectedRoute("/user/:id/comments", {id: "123"})
            );

            assert.equal(router.find("//edit"), null, "Parameters cannot be empty");
            assert.equal(router.find("/user//comment"), null, "Parameters cannot be empty");
        });

        it("supports parameters with and without a postfix", () => {
            const router = createRouter([
                "/:subsystem",
                "/:subsystem/edit",
                "/user/:id/comment",
                "/user/:id" // Create without postfix after route with postfix
            ]);

            assert.deepEqual(
                router.find("/abc"),
                expectedRoute("/:subsystem", {subsystem: "abc"})
            );
            assert.deepEqual(
                router.find("/abc/edit"),
                expectedRoute("/:subsystem/edit", {subsystem: "abc"})
            );

            assert.deepEqual(
                router.find("/user/1/comment"),
                expectedRoute("/user/:id/comment", {id: "1"})
            );
            assert.deepEqual(
                router.find("/user/123"),
                expectedRoute("/user/:id", {id: "123"})
            );
        });

        it("supports matching URLs with a query string", () => {
            const router = createRouter([
                "/:subsystem",
                "/user/:id",
                "/events/:type",
                "/events/:type/subtypes"
            ]);

            assert.deepEqual(
                router.find("/js?"),
                expectedRoute("/:subsystem", {subsystem: "js"})
            );
            assert.deepEqual(
                router.find("/js?foo=bar"),
                expectedRoute("/:subsystem", {subsystem: "js"})
            );
            assert.deepEqual(
                router.find("/user/123?"),
                expectedRoute("/user/:id", {id: "123"})
            );
            assert.deepEqual(
                router.find("/events/change?"),
                expectedRoute("/events/:type", {type: "change"})
            );
            assert.deepEqual(
                router.find("/events/change/subtypes?"),
                expectedRoute("/events/:type/subtypes", {type: "change"})
            );
        });

        it("supports matching URLs with a slash in the query string", () => {
            const router = createRouter([
                "/:subsystem",
                "/user/:id",
                "/events/:type/subtypes"
            ]);

            assert.deepEqual(
                router.find("/js?redirect=/"),
                expectedRoute("/:subsystem", {subsystem: "js"})
            );
            assert.deepEqual(
                router.find("/user/123?redirect=/"),
                expectedRoute("/user/:id", {id: "123"})
            );
            assert.deepEqual(
                router.find("/events/change/subtypes?redirect=/"),
                expectedRoute("/events/:type/subtypes", {type: "change"})
            );
        });

    });

    describe('with combinations of route types', () => {

        it('matches static routes, then parametric routes, then wildcard routes', () => {
            const router = createRouter([
                '/:folder',
                '/user/:id',
                '/',
                '/*',
                '/user',
                '/user/:id/posts',
                '/user/*',
            ]);

            assert.deepEqual(
                router.find('/'),
                expectedRoute('/')
            );
            assert.deepEqual(
                router.find('/js'),
                expectedRoute('/:folder', {folder: 'js'})
            );
            assert.deepEqual(
                router.find('/js/'),
                expectedRoute('/*', {'*': 'js/'})
            );
            assert.deepEqual(
                router.find('/js/webpack'),
                expectedRoute('/*', {'*': 'js/webpack'})
            );
            assert.deepEqual(
                router.find('/user'),
                expectedRoute('/user')
            );
            assert.deepEqual(
                router.find('/user/123'),
                expectedRoute('/user/:id', {id: '123'})
            );
            assert.deepEqual(
                router.find('/user/123/posts'),
                expectedRoute('/user/:id/posts', {id: '123'})
            );
            assert.deepEqual(
                router.find('/user/123/comments'),
                expectedRoute('/user/*', {'*': '123/comments'})
            );
        });

        it('matches parametric routes and wildcard routes that share a common prefix with static routes', () => {
            const router = createRouter([
                '/user/me',
                '/user/:id',
                '/user/:id/posts',
                '/user/*',
            ]);

            assert.deepEqual(
                router.find('/user/me'),
                expectedRoute('/user/me', {})
            );
            assert.deepEqual(
                router.find('/user/m'),
                expectedRoute('/user/:id', {id: 'm'})
            );
            assert.deepEqual(
                router.find('/user/mee'),
                expectedRoute('/user/:id', {id: 'mee'})
            );
            assert.deepEqual(
                router.find('/user/me/posts'),
                expectedRoute('/user/:id/posts', {id: 'me'})
            );
            assert.deepEqual(
                router.find('/user/me/p'),
                expectedRoute('/user/*', {'*': 'me/p'})
            );
            assert.deepEqual(
                router.find('/user/me/post'),
                expectedRoute('/user/*', {'*': 'me/post'})
            );
            assert.deepEqual(
                router.find('/user/me/posts/comments'),
                expectedRoute('/user/*', {'*': 'me/posts/comments'})
            );
        });

    });
});
