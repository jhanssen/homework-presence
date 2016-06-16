/*global require, module, setTimeout, setInterval, clearTimeout, console*/

"use strict";

module.exports = {
    get name() { return "presence"; },
    get ready() { return true; },

    init: function(cfg, data, homework) {
        if (!cfg || !(cfg.devices instanceof Array)) {
            return false;
        }

        var ping = require('ping');

        if (!cfg.frequency)
            cfg.frequency = 300000; // 5 minutes

        let dev = new homework.Device("Presence");
        let val = new homework.Device.Value("Presence");
        val._valueType = "boolean";
        dev.addValue(val);
        homework.addDevice(dev);

        let failures = 0;
        function probe()
        {
            let found = false, count = 0;
            cfg.devices.forEach(function(host) {
                // console.log("pinging host " + host);
                ping.sys.probe(host, function(isAlive) {
                    // console.log("GOT RESPONSE " + host + " " + isAlive);
                    if (isAlive) {
                        found = true;
                    }
                    if (++count == cfg.devices.length) {
                        if (!found) {
                            ++failures;
                            if (failures > (cfg.tolerance || 0)) {
                                // console.log("ALL DEVICES ARE GONE");
                                val.update(false);
                            }
                        } else {
                            // console.log("GOT DEVICES");
                            val.update(true);
                            failures = 0;
                        }
                        timeout = setTimeout(probe, cfg.frequency);
                    }
                });
            });
        }
        homework.utils.onify(this);
        this._initOns();
        timeout = setTimeout(probe, 5000);
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

// module.exports.init({ devices: ["192.168.1.2"], frequency: 5000 }, {}, {addDevice: function() {}});
