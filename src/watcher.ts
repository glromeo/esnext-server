import log from "tiny-node-logger";
import chokidar, {FSWatcher, WatchOptions} from "chokidar";
import {Config} from "./configure";
import chalk from "chalk";
import {useMemo} from "./utils/use-memo";

export type WatcherConfig = Omit<WatchOptions, "cwd" | "atomic" | "disableGlobbing" | "ignoreInitial">

export const useWatcher = useMemo<Config, FSWatcher>(config => {

    const options = Object.assign(Object.freeze({
        cwd: config.basedir,
        atomic: false,
        disableGlobbing: true,
        ignoreInitial: true
    }), config.watcher);

    const watcher = chokidar.watch([], options);

    log.debug("created workspace watcher");

    watcher.on("ready", () => log.info("workspace watcher is", chalk.bold("ready")));

    if (log.includes("debug")) {
        watcher.on("all", (event, file) => log.debug("watcher", event, file));
        const close = watcher.close;
        watcher.close = function () {
            return close.apply(this).then(() => {
                log.debug("workspace watcher closed");
            });
        };
    }

    return watcher;
});
