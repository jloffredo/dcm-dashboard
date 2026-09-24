const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { apiKeyAuth } = require('./middleware/auth');

const userRoutes = require('./routes/user.routes');
const caseRoutes = require('./routes/case.routes');
const evidenceRoutes = require('./routes/evidence.routes');
const assetRoutes = require('./routes/asset.routes');
const agencyRoutes = require('./routes/agency.routes');
const expenseRoutes = require('./routes/expense.routes');
const memoRoutes = require('./routes/memo.routes');
const forensicToolRoutes = require('./routes/forensicTool.routes');
const chainOfCustodyRoutes = require('./routes/chainOfCustody.routes');
const logRoutes = require('./routes/log.routes');

const API_BASE = '/service/api/v1';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    name: 'DCM V1 Mock API',
    status: 'ok',
    base: API_BASE
  });
});

const api = express.Router();
api.use(apiKeyAuth);

api.use(userRoutes);
api.use(caseRoutes);
api.use(evidenceRoutes);
api.use(assetRoutes);
api.use(agencyRoutes);
api.use(expenseRoutes);
api.use(memoRoutes);
api.use(forensicToolRoutes);
api.use(chainOfCustodyRoutes);
api.use(logRoutes);

app.use(API_BASE, api);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

module.exports = app;
