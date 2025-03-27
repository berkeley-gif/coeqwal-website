import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, 'public', 'california', 'allwatersheds_4326.geojson');
const outputFile = path.join(__dirname, 'public', 'california', 'allwatersheds_4326_with_ids.geojson');

console.log('Reading GeoJSON file...');
fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  
  try {
    // Parse the GeoJSON data
    const geojson = JSON.parse(data);
    console.log(`GeoJSON contains ${geojson.features.length} features`);
    
    // Add numeric id to each feature
    geojson.features.forEach((feature, index) => {
      feature.id = index + 1; // Start IDs at 1
    });
    
    // Write the modified GeoJSON back to a new file
    fs.writeFile(outputFile, JSON.stringify(geojson), 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
      console.log(`Successfully wrote ${geojson.features.length} features with IDs to ${outputFile}`);
    });
  } catch (e) {
    console.error('Error processing GeoJSON:', e);
  }
}); 