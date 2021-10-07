import chokidar from "chokidar";
import { Config } from "./configure";
export declare const useWatcher: (key: Config) => chokidar.FSWatcher;
