module.exports = ({on, broadcast, config, watcher}) => {

    on("test", (data, send) => {
        expect(data).eq("hello from mocha!");
        send("ack", "OK");
    });

    on("sub", (data, send) => {
        broadcast("bc", "BYE");
    });

    broadcast("lost", "this message goes lost");
};