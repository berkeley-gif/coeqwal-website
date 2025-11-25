// geojson-loader.cjs
// Turbopack loader that turns raw GeoJSON file contents
// into a JS module exporting the parsed JSON.

module.exports = function geojsonLoader(source) {
  // `source` is the raw file contents as a string
  return `export default ${source};`;
};

