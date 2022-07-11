const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    // '/wbs',
    createProxyMiddleware('/wbs', {
      target: 'http://localhost:8000',
      changeOrigin: false,
      ws: true,
    })
  );
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