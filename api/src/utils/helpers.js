function parseListQuery(req) {
  const start = Number(req.query['start']) || 0;
  const lengthRaw = req.query['length'];
  const length = lengthRaw !== undefined && lengthRaw !== '' ? Number(lengthRaw) : undefined;
  const sortBy = req.query['sort-by'] || undefined;
  const sortDirection = (req.query['sort-direction'] || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
  const fullResponse = req.query['full-response'] === '1' || req.query['full-response'] === 'true';
  return { start, length, sortBy, sortDirection, fullResponse };
}

function sortItems(items, sortBy, sortDirection) {
  if (!sortBy) return items;
  const sorted = [...items].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av).localeCompare(String(bv));
  });
  if (sortDirection === 'desc') sorted.reverse();
  return sorted;
}

// Matches the OpenAPI spec: list endpoints return a plain array by default. `start`/`length`/
// `sort-by`/`sort-direction` still slice and sort that array. `full-response=true` isn't given a
// documented shape in the spec, so it's interpreted here as "include pagination metadata" by
// wrapping the array in {data, total, recordsTotal, recordsFiltered}.
function listResponse(items, req) {
  const { start, length, sortBy, sortDirection, fullResponse } = parseListQuery(req);
  const sorted = sortItems(items, sortBy, sortDirection);
  const total = sorted.length;
  const end = length !== undefined ? start + length : undefined;
  const page = sorted.slice(start, end);

  if (!fullResponse) {
    return page;
  }

  return {
    data: page,
    total,
    start,
    length: length !== undefined ? length : total,
    recordsTotal: total,
    recordsFiltered: total
  };
}

function nextId(collection) {
  return collection.length ? Math.max(...collection.map((i) => i.id)) + 1 : 1;
}

function findById(collection, id) {
  return collection.find((item) => String(item.id) === String(id));
}

function notFound(res, resource = 'Resource') {
  return res.status(404).json({ error: `${resource} not found` });
}

module.exports = {
  parseListQuery,
  sortItems,
  listResponse,
  nextId,
  findById,
  notFound
};
