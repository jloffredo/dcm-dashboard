const { valueForType, buildFieldsBag, applyFieldOverrides, formDescriptor } = require('./dynamicFields');

describe('valueForType', () => {
  it('returns a date string in YYYY-MM-DD form for "date"', () => {
    expect(valueForType('date')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns an ISO datetime string for "datetime"', () => {
    expect(() => new Date(valueForType('datetime')).toISOString()).not.toThrow();
  });

  it('picks a name from the given users for "user"', () => {
    const users = [{ first_name: 'Ada', last_name: 'Lovelace' }];
    expect(valueForType('user', { users })).toBe('Ada Lovelace');
  });

  it('picks a title from the given agencies for "agency"', () => {
    const agencies = [{ title: 'Springfield PD' }];
    expect(valueForType('agency', { agencies })).toBe('Springfield PD');
  });

  it('is case-insensitive on the type name', () => {
    expect(['Yes', 'No']).toContain(valueForType('RADIO'));
  });

  it('falls back to a lorem word for unknown types', () => {
    expect(typeof valueForType('some-unknown-type')).toBe('string');
  });

  it('returns an integer within range for "integer"', () => {
    const value = valueForType('integer');
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(100);
  });
});

describe('buildFieldsBag', () => {
  const fieldDefs = [
    { key: '1_1', type: 'text', required: true },
    { key: '1_2', type: 'text', required: false }
  ];

  it('always fills required fields', () => {
    for (let i = 0; i < 20; i++) {
      const bag = buildFieldsBag(fieldDefs, {});
      expect(bag['1_1'].value).not.toBeNull();
    }
  });

  it('keys each entry by field_id matching the def key', () => {
    const bag = buildFieldsBag(fieldDefs, {});
    expect(bag['1_1'].field_id).toBe('1_1');
    expect(bag['1_2'].field_id).toBe('1_2');
  });

  it('applies an override value verbatim instead of generating one', () => {
    const bag = buildFieldsBag(fieldDefs, {}, { '1_2': 'custom value' });
    expect(bag['1_2']).toEqual({ field_id: '1_2', value: 'custom value' });
  });

  it('applies a null override even though the field is required', () => {
    const bag = buildFieldsBag(fieldDefs, {}, { '1_1': null });
    expect(bag['1_1']).toEqual({ field_id: '1_1', value: null });
  });
});

describe('applyFieldOverrides', () => {
  const fieldDefs = [{ key: '1_1' }, { key: '1_2' }];
  const bag = {
    '1_1': { field_id: '1_1', value: 'original' },
    '1_2': { field_id: '1_2', value: 'unchanged' }
  };

  it('overwrites only the fields present in the request body', () => {
    const result = applyFieldOverrides(bag, fieldDefs, { '1_1': 'updated' });
    expect(result['1_1']).toEqual({ field_id: '1_1', value: 'updated' });
    expect(result['1_2']).toEqual({ field_id: '1_2', value: 'unchanged' });
  });

  it('does not mutate the original bag', () => {
    applyFieldOverrides(bag, fieldDefs, { '1_1': 'updated' });
    expect(bag['1_1'].value).toBe('original');
  });

  it('ignores body keys that are not in the field defs', () => {
    const result = applyFieldOverrides(bag, fieldDefs, { unrelated_key: 'x' });
    expect(result).toEqual(bag);
  });
});

describe('formDescriptor', () => {
  const fieldDefs = [
    { key: '1_1', id: 1, name: 'Field One', description: 'desc', required: true, type: 'text' },
    { key: '1_2', id: 2, name: 'Field Two', description: 'desc', required: false, type: 'text' }
  ];

  it('describes every field when onlyRequired is not set', () => {
    const descriptor = formDescriptor(fieldDefs, undefined);
    expect(Object.keys(descriptor)).toEqual(['1_1', '1_2']);
  });

  it('filters to only required fields when onlyRequired is "true"', () => {
    const descriptor = formDescriptor(fieldDefs, 'true');
    expect(Object.keys(descriptor)).toEqual(['1_1']);
  });

  it('accepts a boolean true as well as the string "true"', () => {
    const descriptor = formDescriptor(fieldDefs, true);
    expect(Object.keys(descriptor)).toEqual(['1_1']);
  });

  it('includes the expected shape for each descriptor entry', () => {
    const descriptor = formDescriptor(fieldDefs, false);
    expect(descriptor['1_1']).toEqual({
      id: 1,
      name: 'Field One',
      description: 'desc',
      required: true,
      type: 'text'
    });
  });
});
