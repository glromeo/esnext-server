import * as path from "path";
import {Config, configure} from "../../src/configure";

export * from "../../src/configure";

export function useFixture<T>(fixture: string): Config {
    const basedir = path.resolve(__dirname, fixture);
    try {
        process.chdir(basedir);
    } catch (e) {
        console.error(`Error: fixture '${fixture}' not found`);
        process.exit(1);
    }
    return configure({basedir});
}
