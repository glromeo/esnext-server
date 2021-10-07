/**
 * This example shows how to modify the configuration using spread operators
 */
module.exports = config => {
    return {
        ...config,
        log: {
            ...config.log,
            level: "trace"
        }
    };
}