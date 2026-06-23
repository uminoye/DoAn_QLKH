const locationService = require('../services/location.service');

const getAll = async (req, res, next) => {
  try { res.json(await locationService.getAll(req.query)); }
  catch (err) { next(err); }
};

const getSuggest = async (req, res, next) => {
  try {
    const { warehouse_id, product_id, qty } = req.query;
    const result = await locationService.getSuggest(warehouse_id, product_id, qty);
    res.json(result);
  } catch (err) { next(err); }
};

module.exports = { getAll, getSuggest };
