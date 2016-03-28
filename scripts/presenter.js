module.exports = (function () {
    'use strict';

    var moment = require('moment');
    var eventTypes = require('./eventTypes.js');
    var parser = require('./model/parseigc.js');
    var timezone = require('./model/timezone.js');

    var listeners = [];
    var igcFile = {};
    
    // Publish an event
    function trigger(topic, data) {
        if (listeners[topic] && listeners[topic].length > 0) {
            listeners[topic].forEach(function (listener) {
                listener(data || {});
            });
        }
    }

    return {
        loadFile: function (igc) {
            try {
                igcFile = parser.parseIGC(igc);
                timezone.detectTimeZone(
                    igcFile.latLong[0],
                    igcFile.recordTime[0],
                    function (tz) {
                        // Convert time offset from milliseconds to minutes.
                        var offsetMinutes = tz.offset / 60.0e3;
                        
                        igcFile.localTime = igcFile.recordTime.map(function(t){
                            return moment(t).utcOffset(offsetMinutes);
                        });
                        trigger(eventTypes.igcLoaded, igcFile);
                    });
            }
            catch (ex) {
                if (ex instanceof parser.IGCException) {
                    trigger(eventTypes.error, ex.message);
                }
                else {
                    throw ex;
                }
            }
        },

        on: function (topic, listener) {
            /// Subscribes to an event.
            // Parameters:
            // topic: The type of event
            // listener: Function to be called when the event happens.
            
            // Create topic if it doesn't already exist
            if (!listeners[topic]) {
                listeners[topic] = [];
            }

            listeners[topic].push(listener);
        }
    }
} ());