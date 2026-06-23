const reportService = require('../services/report.service');

const getInventorySummary = async (req, res, next) => {
  try { res.json(await reportService.getInventorySummary()); }
  catch (err) { next(err); }
};
const getInboundSummary = async (req, res, next) => {
  try { res.json(await reportService.getInboundSummary(req.query)); }
  catch (err) { next(err); }
};
const getOutboundSummary = async (req, res, next) => {
  try { res.json(await reportService.getOutboundSummary(req.query)); }
  catch (err) { next(err); }
};
const getSalesSummary = async (req, res, next) => {
  try { res.json(await reportService.getSalesSummary(req.query)); }
  catch (err) { next(err); }
};
const getDashboardStats = async (req, res, next) => {
  try { res.json(await reportService.getDashboardStats()); }
  catch (err) { next(err); }
};

module.exports = {
  getInventorySummary,
  getInboundSummary,
  getOutboundSummary,
  getSalesSummary,
  getDashboardStats,
};
