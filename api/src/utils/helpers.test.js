const { parseListQuery, sortItems, listResponse, nextId, findById, notFound } = require('./helpers');

describe('parseListQuery', () => {
  it('defaults start to 0, length to undefined, sort-direction to asc', () => {
    const result = parseListQuery({ query: {} });
    expect(result).toEqual({
      start: 0,
      length: undefined,
      sortBy: undefined,
      sortDirection: 'asc',
      fullResponse: false
    });
  });

  it('reads start/length/sort-by/sort-direction/full-response from the query', () => {
    const result = parseListQuery({
      query: { start: '10', length: '5', 'sort-by': 'name', 'sort-direction': 'DESC', 'full-response': 'true' }
    });
    expect(result).toEqual({
      start: 10,
      length: 5,
      sortBy: 'name',
      sortDirection: 'desc',
      fullResponse: true
    });
  });

  it('treats an empty length string as unset rather than 0', () => {
    const result = parseListQuery({ query: { length: '' } });
    expect(result.length).toBeUndefined();
  });

  it('only recognizes full-response=1 or full-response=true', () => {
    expect(parseListQuery({ query: { 'full-response': '1' } }).fullResponse).toBe(true);
    expect(parseListQuery({ query: { 'full-response': 'yes' } }).fullResponse).toBe(false);
  });
});

describe('sortItems', () => {
  const items = [{ name: 'Charlie', age: 30 }, { name: 'Alice', age: 25 }, { name: 'Bob', age: undefined }];

  it('returns the original array unchanged when sortBy is falsy', () => {
    expect(sortItems(items, undefined, 'asc')).toBe(items);
  });

  it('sorts strings ascending by localeCompare', () => {
    const sorted = sortItems(items, 'name', 'asc');
    expect(sorted.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('sorts numbers ascending numerically, not lexically', () => {
    const numeric = [{ n: 10 }, { n: 2 }, { n: 1 }];
    expect(sortItems(numeric, 'n', 'asc').map((i) => i.n)).toEqual([1, 2, 10]);
  });

  it('reverses the order for sort-direction desc', () => {
    const sorted = sortItems(items, 'name', 'desc');
    expect(sorted.map((i) => i.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('sorts nulls/undefined last ascending, and (since desc simply reverses) first for desc', () => {
    const ascSorted = sortItems(items, 'age', 'asc');
    expect(ascSorted[ascSorted.length - 1].name).toBe('Bob');
    const descSorted = sortItems(items, 'age', 'desc');
    expect(descSorted[0].name).toBe('Bob');
  });

  it('does not mutate the input array', () => {
    const copy = [...items];
    sortItems(items, 'name', 'asc');
    expect(items).toEqual(copy);
  });
});

describe('listResponse', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, value: `item-${i + 1}` }));

  it('returns a plain sliced array by default', () => {
    const result = listResponse(items, { query: { start: '0', length: '10' } });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(10);
    expect(result[0]).toEqual(items[0]);
  });

  it('returns the whole list when length is not given', () => {
    const result = listResponse(items, { query: {} });
    expect(result).toHaveLength(25);
  });

  it('slices from the given start offset', () => {
    const result = listResponse(items, { query: { start: '20', length: '10' } });
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual(items[20]);
  });

  it('wraps with pagination metadata when full-response=true', () => {
    const result = listResponse(items, { query: { start: '0', length: '10', 'full-response': 'true' } });
    expect(result).toEqual({
      data: items.slice(0, 10),
      total: 25,
      start: 0,
      length: 10,
      recordsTotal: 25,
      recordsFiltered: 25
    });
  });

  it('defaults the metadata length field to the total when length is unset', () => {
    const result = listResponse(items, { query: { 'full-response': 'true' } });
    expect(result.length).toBe(25);
  });

  it('applies sort-by before slicing', () => {
    const shuffled = [{ id: 3, name: 'c' }, { id: 1, name: 'a' }, { id: 2, name: 'b' }];
    const result = listResponse(shuffled, { query: { 'sort-by': 'name', length: '2' } });
    expect(result.map((i) => i.name)).toEqual(['a', 'b']);
  });
});

describe('nextId', () => {
  it('returns 1 for an empty collection', () => {
    expect(nextId([])).toBe(1);
  });

  it('returns one more than the current max id', () => {
    expect(nextId([{ id: 1 }, { id: 5 }, { id: 3 }])).toBe(6);
  });
});

describe('findById', () => {
  const collection = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];

  it('finds an item by numeric id given a string id', () => {
    expect(findById(collection, '2')).toEqual({ id: 2, name: 'b' });
  });

  it('returns undefined when nothing matches', () => {
    expect(findById(collection, '99')).toBeUndefined();
  });
});

describe('notFound', () => {
  it('sends a 404 with a resource-scoped error message', () => {
    let capturedStatus;
    const res = {
      status(code) {
        capturedStatus = code;
        return { json: (payload) => payload };
      }
    };
    const returned = notFound(res, 'Case');
    expect(capturedStatus).toBe(404);
    expect(returned).toEqual({ error: 'Case not found' });
  });

  it('defaults the resource name to "Resource"', () => {
    let capturedPayload;
    const res = { status: () => ({ json: (payload) => { capturedPayload = payload; return payload; } }) };
    notFound(res);
    expect(capturedPayload).toEqual({ error: 'Resource not found' });
  });
});
