const {createProxyMiddleware} = require('http-proxy-middleware');


module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: false,
    })
  );
  app.use(
    '/media',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: false,
    })
  );
}