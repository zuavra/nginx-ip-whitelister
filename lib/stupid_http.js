import http from 'node:http';
import { URL } from 'node:url';

export default class StupidHttp {
    _server;
    _middleware = [];
    _errorHandlers = [];

    listen(port, host) {
        this._server = http.createServer();

        this._server.on('request', (req, res) => {
            if (!res.local) res.local = {};
            res.local.URL = new URL(req.url, 'http://ignore.this');

            if (this._errorHandlers.length === 0) {
                this._errorHandlers.push({
                    handler: (error, _, res) => {
                        res.statusCode = 500;
                        console.error('Default catch:', error);
                    },
                    route: null,
                });
            }

            let chain = this._middleware;
            let isErrorChain = false;
            let error = null;
            let routeExplicitlyHandled = false;

            for (let i = 0; i < chain.length; i++) {
                try {
                    if (!chain[i].route || chain[i].route === res.local.URL.pathname) {
                        const params = [req, res];
                        if (isErrorChain) {
                            params.unshift(error);
                        }
                        chain[i].handler(...params);
                        if (chain[i].route === res.local.URL.pathname) {
                            routeExplicitlyHandled = true;
                        }
                        if (res.writableEnded) {
                            break;
                        }
                    }
                }
                catch (e) {
                    error = e;
                    isErrorChain = true;
                    chain = this._errorHandlers;
                    i = -1;
                    continue;
                }
            }

            if (!routeExplicitlyHandled && res.statusCode === 200) {
                res.statusCode = 404;
            }
            if (!res.writableEnded) {
                res.end();
            }
        });

        this._server.listen(port, host);
    };

    use(route, ...handlers) {
        for (const handler of handlers) {
            if (2 === handler.length) {
                this._middleware.push({handler, route});
            }
            else if (3 === handler.length) {
                this._errorHandlers.push({handler, route});
            }
            else {
                throw new Error('Handlers must have 2 or 3 parameters.');
            }
        }
    };
};
