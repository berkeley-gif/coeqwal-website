// geojson-loader.cjs
// Turbopack loader that turns raw GeoJSON file contents
// into a JS module exporting the parsed JSON.

module.exports = function geojsonLoader(source) {
  const json = JSON.parse(source) // will throw early if invalid
  return `export default ${JSON.stringify(json)};`
}
