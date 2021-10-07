import log from "tiny-node-logger";
import chokidar, {FSWatcher} from "chokidar";
import {Config} from "./configure";
import chalk from "chalk";
import {useMemo} from "./utils/use-memo";

export const useWatcher = useMemo<Config, FSWatcher>(config => {

    const watcher = chokidar.watch([], config.watcher);

    log.debug("created workspace watcher");

    watcher.on("ready", () => log.info("workspace watcher is", chalk.bold("ready")));

    if (log.includes("debug")) {
        watcher.on("all", (event, file) => log.debug("watcher", event, file));
        const close = watcher.close;
        watcher.close = function () {
            return close.apply(this).then(()=>{
                log.debug("workspace watcher closed");
            });
        }
    }

    return watcher;
});
