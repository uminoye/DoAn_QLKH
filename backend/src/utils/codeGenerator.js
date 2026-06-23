const { query } = require('../config/database');

async function getNextSequence(seqName) {
  const result = await query(`SELECT nextval('${seqName}')`);
  return result.rows[0].nextval;
}

function formatCode(prefix, seq) {
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}

async function getNextCode(prefix, seqName) {
  const seq = await getNextSequence(seqName);
  return formatCode(prefix, seq);
}

module.exports = { getNextSequence, formatCode, getNextCode };
