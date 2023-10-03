export default function StupidHttp(server, urlFactory) {
    const _middleware = [];
    const _errorHandlers = [];
    const _server = server;
    const _sR = new RegExp('^(/[^/]+)/*$');
    const _rtrimSlashes = s => String(s).replace(_sR, '$1');

    _server.on('request', (req, res) => {
        if (!res.local) res.local = {};
        res.local.URL = urlFactory(req.url, 'http://ignore.this');

        if (_errorHandlers.length === 0) {
            _errorHandlers.push({
                handler: (error, _, res) => {
                    res.statusCode = 500;
                    console.error('Default catch:', error);
                },
                route: null,
            });
        }

        let chain = _middleware;
        let isErrorChain = false;
        let error = null;
        let routeExplicitlyHandled = false;

        for (let i = 0; i < chain.length; i++) {
            try {
                const routeMatches = (_rtrimSlashes(chain[i].route) === _rtrimSlashes(res.local.URL.pathname));
                if (!chain[i].route || routeMatches) {
                    const params = [req, res];
                    if (isErrorChain) {
                        params.unshift(error);
                    }
                    chain[i].handler(...params);
                    if (routeMatches) {
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
                chain = _errorHandlers;
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

    this.listen = function(port, host) {
        _server.listen(port, host);
    };

    this.use = function(route, ...handlers) {
        for (const handler of handlers) {
            if (2 === handler.length) {
                _middleware.push({handler, route});
            }
            else if (3 === handler.length) {
                _errorHandlers.push({handler, route});
            }
            else {
                throw new Error('Handlers must have 2 or 3 parameters.');
            }
        }
    };
};
