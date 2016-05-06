/*global require, module, setTimeout, setInterval*/

"use strict";

var interval;

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
            cfg.devices.forEach(function(ip) {
                pingSession.pingHost(ip, function(error, target) {
                    if (error) {
                        ++found;
                    } else {
                        ++notFound;
                    }
                    if (found + notFound == cfg.devices.length) {
                        if (!found) {
                            ++failures;
                            if (failures > (cfg.tolerance || 0)) {
                                console.log("ALL DEVICES ARE GONE");
                            }
                        } else {
                            failures = 0;
                        }
                        setTimeout(ping, cfg.frequency);
                    }
                });
            });
        }
        homework.utils.onify(this);
        this._initOns();
        setTimeout(ping, 5000);
        return true;
    },
    shutdown: function(cb) {
        cb();
    }
};
