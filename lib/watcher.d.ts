import chokidar, { WatchOptions } from "chokidar";
import { Config } from "./configure";
export declare type WatcherConfig = Omit<WatchOptions, "cwd" | "atomic" | "disableGlobbing" | "ignoreInitial">;
export declare const useWatcher: (key: Config) => chokidar.FSWatcher;
