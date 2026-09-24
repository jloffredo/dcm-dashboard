const app = require('./app');

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`DCM mock API listening on http://localhost:${PORT}`);
  console.log(`Base path: http://localhost:${PORT}/service/api/v1`);
});
