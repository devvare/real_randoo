// React Native polyfills for missing web APIs
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}
