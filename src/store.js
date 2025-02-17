const create = (wm, key, value) => (wm.set(key, value), value);
const get = (wm, key, creator) => (wm.has(key) ? wm.get(key) : create(wm, key, creator()));

const stores = new WeakMap();
const root = {};

export const store = schema => {
  const track =
    generator =>
    (...args) => {
      const [obj, , , info] = args;
      const entities = get(stores, schema, () => new WeakMap());
      const childMap = get(entities, obj || root, () => new Map());
      return get(childMap, info.fieldName, () => generator(...args));
    };

  const reset = () => stores.delete(schema);

  const find = path => {
    const entities = stores.get(schema);

    if (!entities) return;

    return path.split('.').reduce((obj, fieldName) => {
      if (!obj) return;

      if (Array.isArray(obj)) {
        return obj.map(x => entities.get(x)).map(x => x && x.get(fieldName));
      }

      const childMap = entities.get(obj);

      if (!childMap) return;

      return childMap.get(fieldName);
    }, root);
  };

  const clear = path => {
    const i = path.lastIndexOf('.');
    const obj = i < 0 ? root : find(path.slice(0, i));

    if (!obj) return;

    const fieldName = path.slice(i + 1);
    const entities = stores.get(schema);
    const childMap = entities.get(obj);
    childMap.set(fieldName, null);
  };

  return {
    clear,
    find,
    reset,
    track,
  };
};
