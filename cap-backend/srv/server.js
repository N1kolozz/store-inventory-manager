const cds = require("@sap/cds");
const express = require('express');
const con2ap = require("@sap/cds-odata-v2-adapter-proxy");
cds.on("bootstrap", function(app) {
    app.use(express.json());
    app.use(function(req, res, next) {
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            if (req.body && typeof req.body === 'object') {
              if (Object.hasOwn(req.body, "Established") && !req.body.Established) {
                req.body.Established = null;
              }
            }
          }
        const { origin } = req.headers;
        if (origin) {
            res.set('access-control-allow-origin', origin);
            res.set('access-control-allow-headers', "*");
            if (req.method === 'OPTIONS')
                return res.set(
                    'access-control-allow-methods',
                    'GET,HEAD,PUT,PATCH,POST,DELETE'
                ).end()
        }
        next()
    });
    app.use(con2ap());
    
});

module.exports = cds.server;