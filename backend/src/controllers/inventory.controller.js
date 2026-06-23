const inventoryService = require('../services/inventory.service');

const getPivotReport = async (req, res, next) => {
  try {
    const result = await inventoryService.getPivotReport();
    res.json(result);
  } catch (err) { next(err); }
};

const getByWarehouse = async (req, res, next) => {
  try {
    const { warehouse_id } = req.query;
    const result = await inventoryService.getByWarehouse(warehouse_id);
    res.json(result);
  } catch (err) { next(err); }
};

const getStockByProduct = async (req, res, next) => {
  try {
    const result = await inventoryService.getStockByProduct(parseInt(req.params.productId, 10));
    res.json(result);
  } catch (err) { next(err); }
};

const traceProduct = async (req, res, next) => {
  try {
    const result = await inventoryService.traceProduct(parseInt(req.params.productId, 10));
    res.json(result);
  } catch (err) { next(err); }
};

module.exports = { getPivotReport, getByWarehouse, getStockByProduct, traceProduct };
