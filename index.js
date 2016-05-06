/*global require, module, setTimeout, setInterval, clearTimeout, console*/

"use strict";

let timeout;
module.exports = {
    get name() { return "presence"; },
    get ready() { return true; },

    init: function(cfg, data, homework) {
        if (!cfg || !(cfg.devices instanceof Array)) {
            return false;
        }


        if (!cfg.frequency)
            cfg.frequency = 300000; // 5 minutes

        let dev = new homework.Device(homework.Device.Type.Presence);
        let val = new homework.Device.Value("Presence");
        val._valueType = "boolean";
        val.update(true);
        dev.addValue(val);
        homework.addDevice(dev);

        let failures = 0;
        function ping()
        {
            const pingSession = require("net-ping").createSession(cfg); // allow overriding all of the
            let found = 0, notFound = 0;
            cfg.devices.forEach(function(address) {
                console.log("pinging host " + address);
                pingSession.pingHost(address, function(error, target) {
                    console.log("GOT RESPONSE " + error + " " + target);
                    if (error) {
                        ++notFound;
                    } else {
                        ++found;
                    }
                    if (found + notFound == cfg.devices.length) {
                        if (!found) {
                            ++failures;
                            if (failures > (cfg.tolerance || 0)) {
                                console.log("ALL DEVICES ARE GONE");
                                val.update(false);
                            }
                            timeout = setTimeout(ping, cfg.errorFrequency || (cfg.frequency / 10));
                        } else {
                            console.log("GOT DEVICES");
                            val.update(true);
                            failures = 0;
                            timeout = setTimeout(ping, cfg.frequency);
                        }
                    }
                });
            });
        }
        homework.utils.onify(this);
        this._initOns();
        timeout = setTimeout(ping, 5000);
        return true;
    },
    shutdown: function(cb) {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        cb();
    }
};

module.exports.init({ devices: ["192.168.1.2"], frequency: 5000 });
