
    document.addEventListener('mousemove', function(event) {
        const customCursor = document.getElementById('customCursor');
        
        // Set the position of the custom cursor
        customCursor.style.left = `${event.clientX}px`;
        customCursor.style.top = `${event.clientY}px`;
    });




// Link controls - open new tab
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
});



// Initialize the map-------------------------------------------------
let steelLayer = L.layerGroup();
let brickLayer = L.layerGroup();
let glassLayer = L.layerGroup();
let concreteLayer = L.layerGroup();
let stoneLayer = L.layerGroup();

let steelLayer200 = L.layerGroup();
let brickLayer200 = L.layerGroup();
let glassLayer200 = L.layerGroup();
let concreteLayer200 = L.layerGroup();
let stoneLayer200 = L.layerGroup();

const nycBounds = L.latLngBounds(
    [40.4774, -74.2591], // SW corner
    [40.9176, -73.7004]  // NE corner
);
const mainMap = L.map('mainMap', {
    center: [40.7128, -73.9460],
    zoom: 13,
    minZoom: 11,
    maxZoom: 14,
    renderer: L.canvas(),
    preferCanvas: true,
    maxBounds: nycBounds,
    maxBoundsViscosity: 1.0
});



// Material colors and offsets
const materialColors = {
    steel: '#d100ff',    // Purple for steel 
    brick: '#ff3100',    // Orange for brick 
    concrete: '#d7ff00', // Yellow for concrete 
    glass: '#00ff93',    // Green for glass 
    stone: '#007bff'     // Blue for stone 
};
const materialOffsets = {
    brick: { lat: 0.0003, lng: -0.0004 },     // Upper left
    stone: { lat: 0.0003, lng: 0.0004 },      // Upper right
    concrete: { lat: -0.0003, lng: -0.0004 }, // Lower left
    glass: { lat: -0.0003, lng: 0.0004 }      // Lower right
};
const materialOffsets200 = {
    brick: { lat: 0.0006, lng: -0.0008 },     // Upper left
    stone: { lat: 0.0006, lng: 0.0008 },      // Upper right
    concrete: { lat: -0.0006, lng: -0.0008 }, // Lower left
    glass: { lat: -0.0006, lng: 0.0008 }      // Lower right
};

// Mapping materials to column names
const materialColumns = {
    steel: 'steel_binned_new_None',
    brick: 'brick_binned_new_None',
    concrete: 'concrete_binned_new_None',
    glass: 'glass_binned_new_None',
    stone: 'stone_binned_new_None'
};
const materialColumns200 = {
    steel: 'steel_binned_200_None',
    brick: 'brick_binned_200_None',
    concrete: 'concrete_binned_200_None',
    glass: 'glass_binned_200_None',
    stone: 'stone_binned_200_None'
};

// Layer state to persist visibility
const layerState = {
    steel: true,
    brick: true,
    concrete: true,
    glass: true,
    stone: true
};

// Function to add material markers to a given layer group
const addMaterialMarkers = (geojsonData, material, color, columnName, layerGroup, offset = null) => {
    const filteredFeatures = geojsonData.features.filter(feature => feature.properties[columnName] > 0);
    const binnedDataValues = filteredFeatures.map(feature => feature.properties[columnName]);
    const quantiles = d3.scaleQuantile()
        .domain(binnedDataValues)
        .range([0, 0.4, 0.8, 1.2, 1.6, 2, 2.4]);

    filteredFeatures.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        const sizeMultiplier = quantiles(feature.properties[columnName]);

        let lat = coordinates[1];
        let lng = coordinates[0];
        if (offset) {
            lat += offset.lat;
            lng += offset.lng;
        }

        if (sizeMultiplier > 0) {
            const baseRadius = 15;
            const minRadius = 5;
            const circle = L.circle([lat, lng], {
                radius: Math.max(baseRadius * sizeMultiplier, minRadius),
                color: color,
                fillColor: color,
                weight: 0,
                fillOpacity: 0.65,
                opacity: 1,
                fillRule: 'evenodd',
                className: `leaflet-circle-${material}`,
                interactive: false
            });

            circle.addTo(layerGroup);
        }
    });

    layerGroup.addTo(mainMap);
};

// Function to add material markers to a given layer group
const addMaterialMarkers200 = (geojsonData, material, color, columnName, layerGroup, offset = null) => {
    const filteredFeatures = geojsonData.features.filter(feature => feature.properties[columnName] > 0);
    const binnedDataValues = filteredFeatures.map(feature => feature.properties[columnName]);
    const quantiles = d3.scaleQuantile()
        .domain(binnedDataValues)
        .range([0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4]);

    filteredFeatures.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        const sizeMultiplier = quantiles(feature.properties[columnName]);

        let lat = coordinates[1];
        let lng = coordinates[0];
        if (offset) {
            lat += offset.lat;
            lng += offset.lng;
        }

        if (sizeMultiplier > 0) {
            const baseRadius = 25;
            const minRadius = 10;
            const circle = L.circle([lat, lng], {
                radius: Math.max(baseRadius * sizeMultiplier, minRadius),
                color: color,
                fillColor: color,
                weight: 0,
                fillOpacity: 0.65,
                opacity: 1,
                fillRule: 'evenodd',
                className: `leaflet-circle-${material}`,
                interactive: false
            });

            circle.addTo(layerGroup);
        }
    });

    layerGroup.addTo(mainMap);
};


// Load GeoJSON data for base layers---------------------------------
Promise.all([
    d3.json('data/nycBinnedCentroidsMaterialWgs84_A.geojson'),
    d3.json('data/nycBinnedCentroidsMaterialWgs84_B.geojson')
]).then(([geojsonDataA, geojsonDataB]) => {
    // Combine the two GeoJSON datasets
    const combinedGeojsonData = {
        type: 'FeatureCollection',
        features: [...geojsonDataA.features, ...geojsonDataB.features]
    };

    // Loop through each material type and add markers
    Object.keys(materialColumns).forEach(material => {
        addMaterialMarkers(
            combinedGeojsonData, 
            material, 
            materialColors[material], 
            materialColumns[material], 
            (() => {
                switch (material) {
                    case 'steel': return steelLayer;
                    case 'brick': return brickLayer;
                    case 'glass': return glassLayer;
                    case 'concrete': return concreteLayer;
                    case 'stone': return stoneLayer;
                }
            })(), 
            materialOffsets[material]
        );
    });

    // Update layer visibility after data is loaded
    updateLayerVisibility();
}).catch(error => {
    console.error('Error loading centroid GeoJSON:', error);
});


// Load GeoJSON data for 200 layers---------------------------------
d3.json('data/nycBinnedCentroidsMaterial_200Wgs84.geojson').then(geojsonData => {
    Object.keys(materialColumns200).forEach(material => {
        addMaterialMarkers200(
            geojsonData, 
            material, 
            materialColors[material], 
            materialColumns200[material], 
            (() => {
                switch (material) {
                    case 'steel': return steelLayer200;
                    case 'brick': return brickLayer200;
                    case 'glass': return glassLayer200;
                    case 'concrete': return concreteLayer200;
                    case 'stone': return stoneLayer200;
                }
            })(), 
            materialOffsets200[material]
        );
    });

    // Update layer visibility after data is loaded
    updateLayerVisibility();
}).catch(error => {
    console.error('Error loading 200-layer GeoJSON:', error);
});




// Additional layers--------------------------------------------------

// Define satellite imagery tile layer (Esri)
const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
    {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    }
);

// Create custom pane for the satellite layer with z-index
const satellitePane = mainMap.createPane('satellitePane');
satellitePane.style.zIndex = 100; // Set the z-index for satellite layer
satellitePane.style.pointerEvents = 'none'; // Disable interaction for the satellite layer (optional)

// Define grayscale OSM tile layer
const grayscaleOSMLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
});

// Create custom pane for the grayscale OSM layer with z-index
const grayscaleOSMPane = mainMap.createPane('grayscaleOSMPane');
grayscaleOSMPane.style.zIndex = 75; // Set the z-index for grayscale OSM layer
grayscaleOSMPane.style.pointerEvents = 'none'; // Disable interaction for the OSM layer (optional)

// Define zoning geojson layer
let zoningLayer; // Declare globally for toggle functionality

fetch('data/nyzd.geojson')
    .then(response => response.json())
    .then(data => {
        // Create a custom pane for the GeoJSON layer
        const zoningPane = mainMap.createPane('zoningPane');
        zoningPane.style.zIndex = 50; 
        zoningPane.style.pointerEvents = 'auto'; // Enable interactions if needed

        // Function to determine fill color based on ZONEDIST property
        const getFillColor = (zonedist) => {
            if (zonedist.startsWith('R')) return 'lightgrey';
            if (zonedist.startsWith('C')) return 'darkgrey';
            if (zonedist.startsWith('M')) return 'grey';
            if (zonedist.startsWith('P')) return 'transparent';
            return 'transparent';
        };

        // Initialize the GeoJSON layer
        zoningLayer = L.geoJSON(data, {
            style: (feature) => {
                const fillColor = getFillColor(feature.properties.ZONEDIST);
                return {
                    weight: 1,                  // Border weight
                    color: fillColor,           // Border color
                    fillColor: fillColor,       // Fill color
                    fillOpacity: 1              // Fill opacity
                };
            },
            pane: 'zoningPane'
        });

        // Now that zoningLayer is initialized, add it to the layers object
        layers.zoningLayer = zoningLayer; // Add zoningLayer dynamically to layers
    })
    .catch(error => console.error('Error loading GeoJSON:', error));


// Define subway geojson layer
let subwayLayer; // Declare globally for toggle functionality

fetch('data/subwayLines.geojson')
    .then(response => response.json())
    .then(data => {
        // Create a custom pane for the GeoJSON layer
        const subwayPane = mainMap.createPane('subwayPane');
        subwayPane.style.zIndex = 60; 
        subwayPane.style.pointerEvents = 'auto'; // Enable interactions if needed

        // Initialize the GeoJSON layer
        subwayLayer = L.geoJSON(data, {
            style: () => {
                return {
                    weight: 4,                  // Thick border weight
                    color: 'black',             // Border color
                    fillColor: 'transparent',   // No fill color
                    fillOpacity: 0,             // Fully transparent fill
                    opacity: 0.5                // Half-transparent border
                };
            },
            pane: 'subwayPane'
        });

        // Now that subwayLayer is initialized, add it to the layers object
        layers.subwayLayer = subwayLayer; // Add subwayLayer dynamically to layers
    })
    .catch(error => console.error('Error loading GeoJSON:', error));








// Map layer control-------------------------------------------------
const layers = {
    grayscaleOSMLayer,
    satelliteLayer,
    // zoningLayer dynamically added here.
    // Add other layers here as needed
};

// Function to update the z-index based on the layer order
function updateLayerZIndexes() {
    // Get the current order of the layers from the sortable list
    const layerOrder = Array.from(document.getElementById('sortable-list').children);

    layerOrder.forEach((item, index) => {
        const layerName = item.getAttribute('data-layer'); // Assuming each item has a data-layer attribute
        const layer = layers[layerName];

        if (layer) {
            // Set the z-index based on the index in the sorted list
            // Higher z-index for layers that come first in the list (top-most layers)
            layer.getPane().style.zIndex = 100 - index; // Adjust 100 as needed for default spacing
        }
    });
}

// Initialize Sortable functionality for the list
new Sortable(document.getElementById('sortable-list'), {
    animation: 150,
    onEnd: () => {
        updateLayerZIndexes(); // Ensure the z-index is updated after sorting
    },
});



function updateLayerZIndexes() {
    const sortableItems = document.getElementById('sortable-list').children;
    
    // Loop through the sorted items
    Array.from(sortableItems).forEach((item, index) => {
        const layerName = item.dataset.layer;
        const layer = layers[layerName]; // Get the layer object from your layers collection
        
        if (layer) {
            // Set the new z-index and log for debugging
            layer.setZIndex(100 - index);
            console.log(`${layerName} updated to z-index: ${100 - index}`);
        } else {
            console.log(`Layer ${layerName} not found.`);
        }
    });
}






// Set the toggle-material button as active by default
const toggleMaterialButton = document.getElementById('toggle-material');
if (toggleMaterialButton) {
    toggleMaterialButton.classList.add('active'); // Mark button as active initially
    const img = toggleMaterialButton.querySelector('img');
    if (img) {
        img.src = 'images/show.svg'; // Set the "active" icon
    }
}

// Toggle buttons
document.querySelectorAll('.show-toggle').forEach(button => {
    button.addEventListener('click', function () {
        const img = this.querySelector('img');
        
        // Toggle the active class and update the icon accordingly
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            img.src = 'images/hide.svg'; // Switch back to "hide" icon
        } else {
            this.classList.add('active');
            img.src = 'images/show.svg'; // Switch to "show" icon
        }
        
        // Ensure to update the layer visibility
        updateLayerVisibility();
    });
});

// Function to handle layer visibility based on zoom
const updateLayerVisibility = () => {
    const isButtonInactive = !document.getElementById('toggle-material').classList.contains('active');
    if (isButtonInactive) {
        // If inactive, remove all layers for that material
        Object.entries({
            steel: [steelLayer, steelLayer200],
            brick: [brickLayer, brickLayer200],
            glass: [glassLayer, glassLayer200],
            concrete: [concreteLayer, concreteLayer200],
            stone: [stoneLayer, stoneLayer200]
        }).forEach(([material, [layer, layer200]]) => {
            if (mainMap.hasLayer(layer)) mainMap.removeLayer(layer);
            if (mainMap.hasLayer(layer200)) mainMap.removeLayer(layer200);
        });
        return; // Exit early if the button is inactive
    }

    const zoom = mainMap.getZoom();

    Object.entries({
        steel: [steelLayer, steelLayer200],
        brick: [brickLayer, brickLayer200],
        glass: [glassLayer, glassLayer200],
        concrete: [concreteLayer, concreteLayer200],
        stone: [stoneLayer, stoneLayer200]
    }).forEach(([material, [layer, layer200]]) => {
        // Only consider the layers that are toggled on
        if (layerState[material]) {
            if (zoom === 13 || zoom === 14) {
                // Show primary layers and remove secondary layers
                if (!mainMap.hasLayer(layer)) {
                    layer.addTo(mainMap);
                }
                if (mainMap.hasLayer(layer200)) {
                    mainMap.removeLayer(layer200);
                }
            } else if (zoom === 11 || zoom === 12) {
                // Show secondary layers and remove primary layers
                if (!mainMap.hasLayer(layer200)) {
                    layer200.addTo(mainMap);
                }
                if (mainMap.hasLayer(layer)) {
                    mainMap.removeLayer(layer);
                }
            } else {
                // Remove both layers outside valid zoom levels
                if (mainMap.hasLayer(layer)) {
                    mainMap.removeLayer(layer);
                }
                if (mainMap.hasLayer(layer200)) {
                    mainMap.removeLayer(layer200);
                }
            }
        } else {
            // If the material is toggled off, ensure both layers are removed
            if (mainMap.hasLayer(layer)) {
                mainMap.removeLayer(layer);
            }
            if (mainMap.hasLayer(layer200)) {
                mainMap.removeLayer(layer200);
            }
        }
    });
};

// Toggle function to control layer visibility
const toggleLayerVisibility = (layer, layer200, buttonId, material) => {
    const button = document.getElementById(buttonId);

    // Toggle visibility based on the current state
    if (mainMap.hasLayer(layer) || mainMap.hasLayer(layer200)) {
        // Remove both layers
        mainMap.removeLayer(layer);
        mainMap.removeLayer(layer200);
        layerState[material] = false; // Mark as turned off
        button.classList.remove('active');
        button.classList.add('inactive');
    } else {
        // Add the appropriate layer based on the current zoom level
        layerState[material] = true; // Mark as turned on
        updateLayerVisibility(); // Update based on the current zoom level
        button.classList.remove('inactive');
        button.classList.add('active');
    }
};






// Define z-index for each layer
const Z_INDEX_SATELLITE = 115;
const Z_INDEX_OSM = 110;
const Z_INDEX_ZONING = 105; 

// Function to toggle grayscale OSM layer visibility
const toggleOSMLayer = () => {
    const button = document.getElementById('toggle-osm');

    if (mainMap.hasLayer(grayscaleOSMLayer)) {
        // Remove the grayscale OSM layer
        mainMap.removeLayer(grayscaleOSMLayer);
        button.classList.remove('active');
        button.classList.add('inactive');
    } else {
        // Add the grayscale OSM layer
        mainMap.addLayer(grayscaleOSMLayer);
        grayscaleOSMLayer.getPane().style.zIndex = Z_INDEX_OSM; // Ensure z-index is correct
        button.classList.remove('inactive');
        button.classList.add('active');
    }
};

// Function to toggle satellite imagery layer visibility
const toggleSatelliteLayer = () => {
    const button = document.getElementById('toggle-satellite');

    if (mainMap.hasLayer(satelliteLayer)) {
        // Remove the satellite imagery layer
        mainMap.removeLayer(satelliteLayer);
        button.classList.remove('active');
        button.classList.add('inactive');
    } else {
        // Add the satellite imagery layer
        mainMap.addLayer(satelliteLayer);
        satelliteLayer.getPane().style.zIndex = Z_INDEX_SATELLITE; // Ensure z-index is correct
        button.classList.remove('inactive');
        button.classList.add('active');
    }
};

// Function to toggle zoning layer visibility
const toggleZoningLayer = () => {
    const button = document.getElementById('toggle-zoning');

    if (zoningLayer) { // Ensure the layer is defined before toggling
        if (mainMap.hasLayer(zoningLayer)) {
            // Remove the zoning layer
            mainMap.removeLayer(zoningLayer);
            button.classList.remove('active');
            button.classList.add('inactive');
        } else {
            // Add the zoning layer
            mainMap.addLayer(zoningLayer);
            zoningLayer.getPane().style.zIndex = Z_INDEX_ZONING; // Ensure z-index is correct
            button.classList.remove('inactive');
            button.classList.add('active');
        }
    } else {
        console.error('Zoning layer is not yet loaded.');
    }
};

// Function to toggle subway layer visibility
const toggleSubwayLayer = () => {
    const button = document.getElementById('toggle-zoning');

    if (subwayLayer) { // Ensure the layer is defined before toggling
        if (mainMap.hasLayer(subwayLayer)) {
            // Remove the zoning layer
            mainMap.removeLayer(subwayLayer);
            button.classList.remove('active');
            button.classList.add('inactive');
        } else {
            // Add the zoning layer
            mainMap.addLayer(subwayLayer);
            subwayLayer.getPane().style.zIndex = Z_INDEX_ZONING; // Ensure z-index is correct
            button.classList.remove('inactive');
            button.classList.add('active');
        }
    } else {
        console.error('Subway layer is not yet loaded.');
    }
};


// Event listeners for toggling layers
document.getElementById('toggleSteel').addEventListener('click', () => {
    toggleLayerVisibility(steelLayer, steelLayer200, 'toggleSteel', 'steel');
});
document.getElementById('toggleBrick').addEventListener('click', () => {
    toggleLayerVisibility(brickLayer, brickLayer200, 'toggleBrick', 'brick');
});
document.getElementById('toggleGlass').addEventListener('click', () => {
    toggleLayerVisibility(glassLayer, glassLayer200, 'toggleGlass', 'glass');
});
document.getElementById('toggleConcrete').addEventListener('click', () => {
    toggleLayerVisibility(concreteLayer, concreteLayer200, 'toggleConcrete', 'concrete');
});
document.getElementById('toggleStone').addEventListener('click', () => {
    toggleLayerVisibility(stoneLayer, stoneLayer200, 'toggleStone', 'stone');
});

// Event listener for toggling OSM layer
document.getElementById('toggle-osm').addEventListener('click', toggleOSMLayer);
// Ensure the OSM layer is inactive by default
if (mainMap.hasLayer(grayscaleOSMLayer)) {
    mainMap.removeLayer(grayscaleOSMLayer);
}

// Event listener for toggling satellite imagery layer
document.getElementById('toggle-satellite').addEventListener('click', toggleSatelliteLayer);
// Ensure the satellite imagery layer is inactive by default
if (mainMap.hasLayer(satelliteLayer)) {
    mainMap.removeLayer(satelliteLayer);
}

// Event listener for toggling zoning layer
document.getElementById('toggle-zoning').addEventListener('click', toggleZoningLayer);

// Event listener for toggling subway layer
document.getElementById('toggle-subway').addEventListener('click', toggleSubwayLayer);


// Restore visibility on zoomend (with the correct layer visibility)
mainMap.on('zoomend', () => {
    updateLayerVisibility();
});

















// Geojson background----------------------------------------------
// Fetch and load the GeoJSON file
fetch('data/coastline.geojson')
    .then(response => response.json())
    .then(data => {
        // Check if the #mainMap element has the 'darkmode' class
        const isDarkMode = document.getElementById('mainMap').classList.contains('darkmode');

        // Set the fillColor based on the dark mode class
        const fillColor = isDarkMode ? 'grey' : 'white';

        // Create a custom pane for the GeoJSON layer
        const blurPane = mainMap.createPane('blurPane');
        blurPane.style.zIndex = 10; // Adjust z-index to place behind interactive layers
        blurPane.style.pointerEvents = 'none'; // Allow interactions to pass through

        // Add the GeoJSON layer to the custom pane
        const coastlineLayer = L.geoJSON(data, {
            style: {
                weight: 0,                // No border
                fillColor: fillColor,     // Dynamically set fillColor
                fillOpacity: 0.5          // Semi-transparent fill
            },
            pane: 'blurPane'             // Attach to the custom pane
        }).addTo(mainMap);

        // Bring the GeoJSON layer to the back
        coastlineLayer.bringToBack();
    })
    .catch(error => console.error('Error loading GeoJSON:', error));









// Geojson Hex Data
    let lockedData = null; // Variable to store the fixed values when clicked
    let isHovering = false; // Flag to check if currently hovering over a GeoJSON feature
    
    fetch('data/hex_all.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error loading GeoJSON file');
            }
            return response.json();
        })
        .then(geojsonData => {
            const materials = ['steel', 'stone', 'glass', 'concrete', 'brick'];
            let allValues = {};
    
            // Collect all values for each material across the GeoJSON
            geojsonData.features.forEach(feature => {
                materials.forEach(material => {
                    const materialKey = `binned_data_${material}_sum`;
                    const materialValue = feature.properties[materialKey];
                    if (materialValue) {
                        if (!allValues[material]) {
                            allValues[material] = [];
                        }
                        allValues[material].push(materialValue);
                    }
                });
            });
    
            // Function to calculate quantiles for each material
            function calculateQuantiles(values, numBins) {
                values.sort((a, b) => a - b); // Ascending order sort
                const quantiles = [];
                for (let i = 1; i <= numBins; i++) {
                    const index = Math.floor((i / numBins) * values.length);
                    quantiles.push(values[index]);
                }
                return quantiles;
            }
    
            // Calculate quantiles for each material
            const numBins = 6;
            const quantiles = {};
            materials.forEach(material => {
                quantiles[material] = calculateQuantiles(allValues[material], numBins);
            });
    
            // Function to classify a value into its corresponding quantile bin
            function getQuantileBin(value, quantiles) {
                for (let i = 0; i < quantiles.length; i++) {
                    if (value <= quantiles[i]) {
                        return i; // Return the class index (0-5)
                    }
                }
                return quantiles.length - 1; // If the value is higher than the last quantile
            }
    
            // Helper function to format large numbers
            function formatNumber(value) {
                if (value >= 1e6) {
                    return (value / 1e6).toFixed(2) + ' million'; 
                } else if (value >= 1e3) {
                    return (value / 1e3).toFixed(2) + ' thousand'; 
                }
                return value.toString();
            }
    
            // Add geoJSON layer and bind mouseover and click events
            const geojsonLayer = L.geoJSON(geojsonData, {
                style: {
                    weight: 0,
                    opacity: 0,
                    fillOpacity: 0
                },
                interactive: true,
                onEachFeature: (feature, layer) => {
                    layer.on('mouseover', () => {
                        isHovering = true; // Set hovering flag
    
                        // Extract values for the hovered feature
                        let materialData = materials.map(material => {
                            const materialKey = `binned_data_${material}_sum`;
                            const materialValue = feature.properties[materialKey];
                            if (materialValue) {
                                const binIndex = getQuantileBin(materialValue, quantiles[material]);
                                return binIndex;
                            }
                            return 0;
                        });
    
                        // Check if all values are 0
                        const allZero = materialData.every(value => value === 0);
                        if (allZero && lockedData) {
                            // Display locked data if all hovered values are 0
                            RoseChart.data.datasets[0].data = lockedData;
                        } else {
                            // Update the rose chart with hovered data
                            RoseChart.data.datasets[0].data = materialData;
                        }
                        RoseChart.update();
                    });
    
                    layer.on('mouseout', () => {
                        isHovering = false; // Clear hovering flag
    
                        // Revert to locked data if no hover data is available
                        if (lockedData) {
                            RoseChart.data.datasets[0].data = lockedData;
                            RoseChart.update();
                        }
                    });
    
                    layer.on('click', () => {
                        // Extract and lock values for the clicked feature
                        const materialData = materials.map(material => {
                            const materialKey = `binned_data_${material}_sum`;
                            const materialValue = feature.properties[materialKey];
                            if (materialValue) {
                                const binIndex = getQuantileBin(materialValue, quantiles[material]);
                                return binIndex;
                            }
                            return 0;
                        });
    
                        lockedData = materialData;
    
                        // Update the rose chart with locked data
                        RoseChart.data.datasets[0].data = materialData;
                        RoseChart.update();
    
                        const materialValues = materials.map(material => {
                            const materialKey = `binned_data_${material}_sum`;
                            const rawValue = feature.properties[materialKey];
                            const formattedValue = rawValue ? formatNumber(rawValue) : 'N/A';
                            return `${material.charAt(0).toUpperCase() + material.slice(1)}: ${formattedValue}`;
                        }).join('<br>');
    
                        // Add a Leaflet popup
                        const popup = L.popup()
                            .setLatLng(layer.getBounds().getCenter()) // Center of the hexagon
                            .setContent(`<strong>Average FAR</strong><br><strong>Average Building Age</strong><br><strong>Prominent Building Use</strong><br><strong>Material Values</strong><br>${materialValues}`)
                            .openOn(mainMap);
                    });
                }
            }).addTo(mainMap);
    
            // Handle mousemove outside any GeoJSON features
            mainMap.on('mousemove', () => {
                if (!isHovering && lockedData) {
                    // Revert to locked data when not hovering or all values are 0
                    RoseChart.data.datasets[0].data = lockedData;
                    RoseChart.update();
                }
            });
    
            // Set the z-index to ensure it's above any other layers
            geojsonLayer.setZIndex(9999);
        })
        .catch(error => {
            console.error('Error loading GeoJSON data:', error);
        });
    






// Rose Chart------------------------------------------------------------
// Initial chart data with original colors
const data = {
    labels: ['STEEL', 'STONE', 'GLASS', 'CONCRETE', 'BRICK'],
    datasets: [{
        label: 'density level',
        data: [0, 0, 0, 0, 0],  // Initialize with zero
        backgroundColor: [
            '#ec49fd',  // Steel
            '#60bdff',  // Stone
            '#49fcd7',  // Glass
            '#ddfa47',  // Concrete
            '#ff785a'   // Brick
        ],
        borderWidth: 0
    }]
};

const config = {
    type: 'polarArea',
    data: data,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                min: 0,
                max: 5,
                grid: {
                    color: '#bfcdcd', 
                    lineWidth: 1,
                    z: 1,
                    circular: true, 
                },
                angleLines: {
                    color: 'rgba(0, 0, 0, 0.2)', 
                    lineWidth: 1,
                    z: 1,
                },
                ticks: {
                    callback: function (value) {
                        const romanNumerals = ['NULL', 'I', 'II', 'III', 'IV', 'V'];
                        return romanNumerals[value]; 
                    },
                    z: 2,
                    color: 'transparent', 
                    font: {
                        family: 'Poppins',
                        weight: '500'
                    },
                    backdropColor: 'rgba(0, 0, 0, 0)', 
                },
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                titleFont: {
                    family: 'Poppins, sans-serif',
                    size: 14,
                    weight: 'normal'
                },
                titleColor: 'black',
                bodyFont: {
                    family: 'Poppins, sans-serif',
                    size: 12,
                    weight: 'normal'
                },
                bodyColor: 'black',
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                cornerRadius: 6,
                displayColors: false,
                padding: 10
            }
        }
    }
};


// Create the chart instance
const RoseChart = new Chart(document.getElementById('RoseChart'), config);

// Original colors for each layer
const originalColors = {
    Brick: '#ff785a',
    Concrete: '#ddfa47',
    Glass: '#49fcd7',
    Stone: '#60bdff',
    Steel: '#ec49fd'
};

// Add event listeners to the buttons to toggle the layers' visibility
document.getElementById('toggleBrick').addEventListener('click', () => toggleLayer('Brick'));
document.getElementById('toggleConcrete').addEventListener('click', () => toggleLayer('Concrete'));
document.getElementById('toggleGlass').addEventListener('click', () => toggleLayer('Glass'));
document.getElementById('toggleStone').addEventListener('click', () => toggleLayer('Stone'));
document.getElementById('toggleSteel').addEventListener('click', () => toggleLayer('Steel'));






// Rose chart color toggle function----------------------------------------
function toggleLayer(layer) {
    const layerIndex = data.labels.indexOf(layer);
    
    // If the color is transparent, reset to the original color
    if (data.datasets[0].backgroundColor[layerIndex] === 'transparent') {
        data.datasets[0].backgroundColor[layerIndex] = originalColors[layer];
    } else {
        // Otherwise, set the color to transparent
        data.datasets[0].backgroundColor[layerIndex] = 'transparent';
    }
    
    // Update the chart to reflect the changes
    RoseChart.update();
}

// Quantile calculation (unchanged)
function calculateQuantiles(values, numBins) {
    values.sort((a, b) => a - b);  // Ascending order sort
    const quantiles = [];
    for (let i = 1; i <= numBins; i++) {
        const index = Math.floor((i / numBins) * values.length);
        quantiles.push(values[index]);
    }
    return quantiles;
}

function getQuantileBin(value, quantiles) {
    for (let i = 0; i < quantiles.length; i++) {
        if (value <= quantiles[i]) {
            return i;  // Return the bin index
        }
    }
    return quantiles.length - 1;  // If value is greater than the highest quantile
}






// Rose Chart References----------------------------------------
function createDataObject(dataValues) {
    return {
        labels: ['Steel', 'Stone', 'Glass', 'Concrete', 'Brick'],
        datasets: [{
            label: 'density level',
            data: dataValues,
            backgroundColor: [
                '#ec49fd',  // Steel
                '#60bdff',  // Stone
                '#49fcd7',  // Glass
                '#ddfa47',  // Concrete
                '#ff785a'   // Brick
            ],
            borderWidth: 0
        }]
    };
}

// Creating the data objects
const dataA = createDataObject([3, 5, 1, 1, 2]);
const dataB = createDataObject([4, 1, 5, 3, 0]);
const dataC = createDataObject([5, 1, 2, 4, 3]);


function createPolarAreaConfig(data) {
    return {
        type: 'polarArea',
        data: data,
        options: {
            responsive: false, 
            maintainAspectRatio: true, 
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    grid: {
                        color: '#bfcdcd',
                        lineWidth: 1,
                        z: 1,
                        circular: true,
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.2)',
                        lineWidth: 1,
                        z: 1,
                    },
                    ticks: {
                        callback: function (value) {
                            const romanNumerals = ['NULL', 'I', 'II', 'III', 'IV', 'V'];
                            return romanNumerals[value];
                        },
                        z: 2,
                        color: 'transparent',
                        padding: 0,
                        backdropColor: 'rgba(0, 0, 0, 0)', 
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleFont: {
                        family: 'Poppins, sans-serif',
                        size: 14,
                        weight: 'normal'
                    },
                    titleColor: 'black',
                    bodyFont: {
                        family: 'Poppins, sans-serif',
                        size: 12,
                        weight: 'normal'
                    },
                    bodyColor: 'black',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false,
                    padding: 10
                }
            }
        }
    };
}

// Creating the configurations
const configA = createPolarAreaConfig(dataA);
const configB = createPolarAreaConfig(dataB);
const configC = createPolarAreaConfig(dataC);


// Create the chart instance
const RoseChartRefA = new Chart(document.getElementById('RoseChartRefA'), configA);
const RoseChartRefB = new Chart(document.getElementById('RoseChartRefB'), configB);
const RoseChartRefC = new Chart(document.getElementById('RoseChartRefC'), configC);








// Sidebar
// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {
    // Initialize the sidebar state as expanded
    let isSidebarExpanded = true;

    // Get references to the sidebar, button, and icon
    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("toggleButton");
    const toggleIcon = document.getElementById("toggleIcon");

    toggleButton.addEventListener("click", function() {
        if (isSidebarExpanded) {
            // Collapse the sidebar
            sidebar.style.transform = "translateX(-100%)"; // Move sidebar offscreen
            toggleButton.style.left = "0"; // Move the button to the left side
            toggleIcon.innerHTML = '<path d="M8 20l7-7-7-7" fill="transparent" stroke="#585f5f" stroke-width="3" stroke-linecap="flat" stroke-linejoin="round"/>'; 
        } else {
            // Expand the sidebar
            sidebar.style.transform = "translateX(0)"; // Move sidebar back onscreen
            toggleButton.style.left = "360px"; // Position the button at the sidebar's expanded edge
            toggleIcon.innerHTML = '<path d="M14 7l-7 7 7 7" fill="transparent" stroke="#585f5f" stroke-width="3" stroke-linecap="flat" stroke-linejoin="round"/>'; 
        }

        // Toggle the state
        isSidebarExpanded = !isSidebarExpanded;


    });

    // Initialize the sidebar in the expanded state on load
    sidebar.style.transform = "translateX(0)"; // Ensure the sidebar is expanded initially
});








// Nav Button-------------------------------------------------------
// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {
    const buttons = document.querySelectorAll('.nav-button');
    const line = document.createElement('div'); // Create line element
    line.classList.add('active-line'); // Set class for styling
    document.getElementById('sidebar').appendChild(line); // Append to sidebar

    // Position line initially under the explorer button
    const initialButton = document.getElementById('explorerButton');
    line.style.width = `${initialButton.offsetWidth - 10}px`; // Set width
    line.style.position = 'absolute';
    line.style.bottom = '-5px'; // Position it
    line.style.left = `${initialButton.offsetLeft + 5}px`; // Align with explorer button

    // Mark explorer button as active initially
    initialButton.classList.add('active');

    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            buttons.forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to the clicked button
            this.classList.add('active');

            // Move the line under the clicked button with a smooth transition
            line.style.width = `${this.offsetWidth - 10}px`;
            line.style.left = `${this.offsetLeft + 5}px`; // Adjust the position to align with the button
        });
    });
});






// Popup modals--------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Common elements
    const materialPopup = document.getElementById('materialPopup');
    const rosePopup = document.getElementById('rosePopup');
    const vizPopup = document.getElementById('visualizationPopup');
    const optionsPopup = document.getElementById('optionsPopup');
    const versionPopup = document.getElementById('versionPopup'); 
    const guidePopup = document.getElementById('guidePopup');
    const closePopupButtons = document.querySelectorAll('.popupCloseButton'); 

    // Info icons
    const infoIcon = document.getElementById('materialInfo');
    const roseInfoIcon = document.getElementById('roseInfo');
    const vizInfoIcon = document.getElementById('visualizationArchive');
    const optionsIcon = document.getElementById('optionsIcon')
    const versionHistoryLink = document.getElementById('versionHistoryLink');
    const guideButton = document.getElementById('guideButton'); 

    // Version history element
    const versionHistoryContent = document.getElementById('versionHistoryContent');

    // Fetch version history to update link text
    function updateVersionHistory() {
        fetch('version_history.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error loading version history file: ${response.statusText}`);
            }
            return response.text();
        })
        .then(data => {
            const lines = data.split('\n');
            let firstVersion = '';

            for (let i = 0; i < lines.length; i++) { 
                if (lines[i].startsWith('alpha')) {
                    // Extract the version text and remove the date if present
                    firstVersion = lines[i].split('(')[0].trim();
                    console.log('First alpha version found:', firstVersion); // Debug log
                    break; 
                }
            }

            const versionHistoryLink = document.getElementById('versionHistoryLink');
            if (versionHistoryLink && firstVersion) {
                versionHistoryLink.textContent = firstVersion;
                console.log('Updated version history link text:', firstVersion); // Debug log
            } else {
                console.warn('Version history link element not found or no version found');
            }
        })
        .catch(error => {
            console.error('Error fetching version history:', error);
        });
    }

    updateVersionHistory();

    // Add listeners to all close buttons
    closePopupButtons.forEach(closePopup => {
        closePopup.addEventListener('click', (event) => {
            console.log("Close button clicked");
            event.stopPropagation(); // Prevent the click event from bubbling up

            // Close all popups
            [materialPopup, rosePopup, vizPopup, versionPopup, guidePopup, optionsPopup].forEach(popupElement => {
                if (popupElement) {
                    popupElement.classList.add('hidden'); // Trigger slide-up animation
                    setTimeout(() => {
                        popupElement.style.display = 'none'; // Hide
                    }, 500);
                }
            });
        });
    });

    // Show the material popup
    infoIcon.addEventListener('click', () => {
        console.log("Material popup clicked");
        materialPopup.classList.remove('hidden');
        materialPopup.style.display = 'flex'; 
    });

    // Show the rose popup
    roseInfoIcon.addEventListener('click', () => {
        console.log("Rose popup clicked");
        rosePopup.classList.remove('hidden');
        rosePopup.style.display = 'flex'; 
    });

    // Show the visualization popup
    vizInfoIcon.addEventListener('click', () => {
        console.log("Rose popup clicked");
        vizPopup.classList.remove('hidden');
        vizPopup.style.display = 'flex'; 
    });

    // Show the options popup
    optionsIcon.addEventListener('click', () => {
        console.log("Options popup clicked");
        optionsPopup.classList.remove('hidden');
        optionsPopup.style.display = 'flex'; 
    });

    // Fetch and display version history when the link is clicked
    versionHistoryLink.addEventListener('click', () => {
        fetch('version_history.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                console.log('Fetched response:', response); // Log the raw response
                return response.text();
            })
            .then(data => {
                console.log('Fetched data:', data); // Log the fetched text
                versionHistoryContent.innerHTML = data.replace(/\n/g, '<br>');
                versionPopup.classList.remove('hidden');
                versionPopup.style.display = 'flex';
            })
            .catch(error => {
                console.error('Fetch operation error:', error);
            });
    });

    // Show guide popup on page load
    guidePopup.classList.remove('hidden');
    guidePopup.style.display = 'flex';

    // Open guide popup when the guide button is clicked
    guideButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the document click event from firing
        guidePopup.classList.remove('hidden');
        guidePopup.style.display = 'flex';
    });
    // Close guide popup on clicking anywhere (inside or outside)
    document.addEventListener('click', (event) => {
        if (guidePopup && !guidePopup.classList.contains('hidden')) {
            guidePopup.classList.add('hidden'); // Add the hidden class to hide it
            setTimeout(() => {
                guidePopup.style.display = 'none'; // Completely hide after animation
            }, 500);
        }
    });
});





// Splide slider---------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const visualizationPopup = document.getElementById('visualizationPopup');
    const collapsePopup = document.getElementById('collapsePopup');
    const mainSliderList = document.querySelector('#main-slider .splide__list');
    const thumbnailSliderList = document.querySelector('#thumbnail-slider .splide__list');

    const images = [
        "VA-01.webp", "VA-02.webp", "VA-03.webp", "VA-04.webp",
        "VA-05.webp", "VA-06.webp", "VA-07.webp", "VA-08.webp",
        "VA-09.webp", "VA-10.webp", "VA-11.webp", "VA-12.webp"
    ];

    // Generate slides for main and thumbnail sliders
    images.forEach(image => {
        const mainLi = document.createElement('li');
        mainLi.classList.add('splide__slide');
        const mainImg = document.createElement('img');
        mainImg.src = `https://raw.githubusercontent.com/halfward/UrbanVein/main/media/${image}`;
        mainImg.alt = `Slide ${image}`;
        mainLi.appendChild(mainImg);
        mainSliderList.appendChild(mainLi);

        const thumbLi = document.createElement('li');
        thumbLi.classList.add('splide__slide');
        const thumbImg = document.createElement('img');
        thumbImg.src = `https://raw.githubusercontent.com/halfward/UrbanVein/main/media/${image}`;
        thumbImg.alt = `Thumbnail ${image}`;
        thumbLi.appendChild(thumbImg);
        thumbnailSliderList.appendChild(thumbLi);
    });

    // Initialize Splide sliders
    const mainSlider = new Splide('#main-slider', {
        type       : 'fade',
        heightRatio: 1.5,
        pagination : false,
        arrows     : false,
        cover      : true,
    });

    const thumbnailSlider = new Splide('#thumbnail-slider', {
        rewind       : true,
        fixedWidth   : 50,
        fixedHeight  : 75,
        isNavigation : true,
        gap          : 10,
        focus        : 'center',
        pagination   : false,
        cover        : true,
        breakpoints  : {
            640: {
                fixedWidth  : 66,
                fixedHeight : 38,
            },
        },
    });

    // Sync main slider with thumbnails
    mainSlider.sync(thumbnailSlider);
    mainSlider.mount();
    thumbnailSlider.mount();

    // Open popup and refresh sliders
    document.getElementById('visualizationArchive').addEventListener('click', () => {
        visualizationPopup.style.display = 'flex';
        mainSlider.refresh(); // Refresh main slider
        thumbnailSlider.refresh(); // Refresh thumbnails
    });

    // Close popup
    collapsePopup.addEventListener('click', () => {
        visualizationPopup.style.display = 'none';
    });
});







// Content text
document.addEventListener("DOMContentLoaded", function() {
    const aboutContent = document.getElementById('aboutContentText');
    const storiesContent = document.getElementById('storiesContentText');
    const exploreContent = document.getElementById('exploreContentText');
    const navButtonAContainer = document.getElementById('navButtonAContainer');
    const navButtonBContainer = document.getElementById('navButtonBContainer');
    const navButtonCContainer = document.getElementById('navButtonCContainer');

    // Function to update content based on button clicked
    function updatecontentMain(buttonId) {
        // Hide all content divs
        aboutContent.style.display = 'none';
        storiesContent.style.display = 'none';
        exploreContent.style.display = 'none';

        // Hide all nav button containers initially
        navButtonAContainer.style.display = 'none';
        navButtonBContainer.style.display = 'none';
        navButtonCContainer.style.display = 'none';

        // Show relevant content based on button ID
        switch (buttonId) {
            case 'aboutButton':
                aboutContent.style.display = 'block';
                navButtonAContainer.style.display = 'flex'; 
                break;
            case 'storiesButton':
                storiesContent.style.display = 'block';
                navButtonBContainer.style.display = 'flex'; 
                break;
            case 'explorerButton':
                exploreContent.style.display = 'block';
                navButtonCContainer.style.display = 'flex'; 
                break;
            default:
                aboutContent.style.display = 'none';
                storiesContent.style.display = 'none';
                exploreContent.style.display = 'none';
                navButtonAContainer.style.display = 'none'; 
                navButtonBContainer.style.display = 'none'; 
                navButtonCContainer.style.display = 'flex'; 
        }
    }

    // Attach event listeners to buttons
    document.getElementById('aboutButton').addEventListener('click', function() {
        updatecontentMain('aboutButton');
    });

    document.getElementById('storiesButton').addEventListener('click', function() {
        updatecontentMain('storiesButton');
    });

    document.getElementById('explorerButton').addEventListener('click', function() {
        updatecontentMain('explorerButton');
    });

    // Initialize by showing the Explorer content or any default section
    updatecontentMain('explorerButton');

    // Function to observe display changes using MutationObserver
    function observeDisplayChanges() {
        // Select all the target elements
        const elements = [aboutContent, storiesContent, exploreContent, 
                          navButtonAContainer, navButtonBContainer, navButtonCContainer];

        // Create a MutationObserver to listen for style changes
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    // If the display property changes, adjust height
                    adjustHeight(); 
                }
            });
        });

        // Set observer options to watch for changes to the 'style' attribute
        elements.forEach(element => {
            observer.observe(element, { attributes: true });  // Watch for changes to attributes
        });
    }

    // Initialize the MutationObserver
    observeDisplayChanges();
});





// Second Tab Logic

// Main navigation buttons
const exploreButton = document.getElementById('explorerButton');
const aboutButton = document.getElementById('aboutButton');
const storiesButton = document.getElementById('storiesButton');

// Second-layer navigation buttons
const navButtons = document.querySelectorAll('.nav-button-2');

// Content elements
const scrollableTextData = document.getElementById('scrollableTextData');
const scrollableTextMedia = document.getElementById('scrollableTextMedia');
const scrollableTextRef = document.getElementById('scrollableTextRef');
const scrollableTextPast = document.getElementById('scrollableTextPast');
const scrollableTextPresent = document.getElementById('scrollableTextPresent');
const scrollableTextFuture = document.getElementById('scrollableTextFuture');
const scrollableTextC = document.getElementById('scrollableTextC');
const roseChart = document.getElementById('Chart');
const layerControls = document.getElementById('layerControls');
const scrollableTextTimeline = document.getElementById('scrollableTextTimeline');
const scrollableTextMaps = document.getElementById('scrollableTextMaps');

// Variables to track button states
let isExploreActive = false;
let isAboutActive = false;
let isStoriesActive = false;
let isDataActive = false;
let isMediaActive = false;
let isRefActive = false;
let isPastActive = false;
let isPresentActive = false;
let isFutureActive = false;
let isLegendActive = false;
let isTimelineActive = false;
let isMapsActive = false;

// Helper function to toggle element visibility
function updateDisplay(element, condition) {
    element.style.display = condition ? 'block' : 'none';
}

// Reset all second-layer content visibility
function resetSecondLayerContent() {
    const allSecondLayerContent = [
        scrollableTextData, scrollableTextMedia, scrollableTextRef,
        scrollableTextPast, scrollableTextPresent, scrollableTextFuture,
        scrollableTextC, roseChart, layerControls,
        scrollableTextTimeline, scrollableTextMaps
    ];
    allSecondLayerContent.forEach(content => {
        if (content) content.style.display = 'none';
    });
}

// Update individual display groups
function updateAboutAndDataDisplay() {
    updateDisplay(scrollableTextData, isAboutActive && isDataActive);
}
function updateAboutAndMediaDisplay() {
    updateDisplay(scrollableTextMedia, isAboutActive && isMediaActive);
}
function updateAboutAndRefDisplay() {
    updateDisplay(scrollableTextRef, isAboutActive && isRefActive);
}
function updateStoriesAndPastDisplay() {
    updateDisplay(scrollableTextPast, isStoriesActive && isPastActive);
}
function updateStoriesAndPresentDisplay() {
    updateDisplay(scrollableTextPresent, isStoriesActive && isPresentActive);
}
function updateStoriesAndFutureDisplay() {
    updateDisplay(scrollableTextFuture, isStoriesActive && isFutureActive);
}
function updateExploreAndLegendDisplay() {
    const shouldDisplay = isExploreActive && isLegendActive;

    // Update the display property for flex layout
    if (shouldDisplay) {
        layerControls.style.display = 'flex';
        layerControls.style.flexWrap = 'wrap';
        layerControls.style.justifyContent = 'space-between';
    } else {
        layerControls.style.display = 'none';
    }

    // Update other elements
    updateDisplay(roseChart, shouldDisplay);
    updateDisplay(scrollableTextC, shouldDisplay);
}
function updateExploreAndTimelineDisplay() {
    updateDisplay(scrollableTextTimeline, isExploreActive && isTimelineActive);
}
function updateExploreAndMapsDisplay() {
    updateDisplay(scrollableTextMaps, isExploreActive && isMapsActive);
}

// Function to update display elements based on active states
function updateDisplays() {
    resetSecondLayerContent(); // Reset all second-layer content visibility
    updateAboutAndDataDisplay();
    updateAboutAndMediaDisplay();
    updateAboutAndRefDisplay();
    updateStoriesAndPastDisplay();
    updateStoriesAndPresentDisplay();
    updateStoriesAndFutureDisplay();
    updateExploreAndLegendDisplay();
    updateExploreAndTimelineDisplay();
    updateExploreAndMapsDisplay();
}

// Helper function to manage active button states
function setActiveButton(buttonId) {
    navButtons.forEach(btn => btn.classList.remove('active')); // Remove 'active' from all buttons
    const activeButton = document.getElementById(buttonId);
    if (activeButton) {
        activeButton.classList.add('active'); // Add 'active' to the specified button
    }
}

// Reset layer states when switched to another major tab
function resetSecondLayerStates() {
    isDataActive = false;
    isMediaActive = false;
    isRefActive = false;
    isPastActive = false;
    isPresentActive = false;
    isFutureActive = false;
    isLegendActive = false;
    isTimelineActive = false;
    isMapsActive = false;
}

// Event listeners for main navigation buttons
exploreButton.addEventListener('click', () => {
    resetSecondLayerStates();
    isExploreActive = true;
    isAboutActive = false;
    isStoriesActive = false;
    isLegendActive = true;
    setActiveButton('legendButton'); // Set legendButton as active
    updateDisplays();
});

aboutButton.addEventListener('click', () => {
    resetSecondLayerStates();
    isAboutActive = true;
    isExploreActive = false;
    isStoriesActive = false;
    isDataActive = true;
    setActiveButton('dataButton'); // Set dataButton as active
    updateDisplays();
});

storiesButton.addEventListener('click', () => {
    resetSecondLayerStates();
    isStoriesActive = true;
    isExploreActive = false;
    isAboutActive = false;
    isPastActive = true;
    setActiveButton('pastButton'); // Set pastButton as active
    updateDisplays();
});

// Add click event listeners to nav-2 buttons
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        setActiveButton(button.id); // Update active state for clicked button
        updateContent(button.id);
    });
});

// Function to handle content updates
function updateContent(buttonId) {
    console.log('Updating content for:', buttonId);

    // Set active states based on button ID
    isDataActive = (buttonId === 'dataButton');
    isMediaActive = (buttonId === 'mediaButton');
    isRefActive = (buttonId === 'refButton');

    isPastActive = (buttonId === 'pastButton');
    isPresentActive = (buttonId === 'presentButton');
    isFutureActive = (buttonId === 'futureButton');

    isLegendActive = (buttonId === 'legendButton');
    isTimelineActive = (buttonId === 'timelineButton');
    isMapsActive = (buttonId === 'mapsButton');

    // Update display elements based on states
    updateDisplays();
}

// Set default states on page load
isExploreActive = true;
isLegendActive = true;
setActiveButton('legendButton');
updateDisplays(); // Update displays based on default state

// MutationObserver to detect display changes
function observeDisplayChanges() {
    const elementsToObserve = [
        scrollableTextData, scrollableTextMedia, scrollableTextRef,
        scrollableTextPast, scrollableTextPresent, scrollableTextFuture,
        scrollableTextC, roseChart, layerControls,
        scrollableTextTimeline, scrollableTextMaps
    ];

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (mutation.target.style.display === 'none') {
                    adjustHeight();
                }
            }
        });
    });

    // Observer options
    const config = { attributes: true, attributeFilter: ['style'] };
    
    elementsToObserve.forEach(element => {
        observer.observe(element, config);
    });
}

// Initialize the MutationObserver
observeDisplayChanges();

// Function to adjust height when display is set to 'none'
function adjustHeight() {
    console.log("Adjusting height...");
    // You can implement your height adjustment logic here
}









// Dark mode------------------------------------------
    // Select the options icon and the body element
    const optionsIcon = document.getElementById('darkModeButton');
    const body = document.body;

    // Check if dark mode is already saved in localStorage (if you want to persist the mode between sessions)
    if(localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('darkmode');
    }

    // Event listener to toggle dark mode when clicking the icon
    optionsIcon.addEventListener('click', function() {
        body.classList.toggle('darkmode');

        // Save the state of dark mode in localStorage
        if (body.classList.contains('darkmode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.removeItem('darkMode');
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        // Fullscreen button action
        const fullscreenButton = document.getElementById("fullscreenButton");
        
        fullscreenButton.addEventListener("click", () => {
            if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
            });
            } else {
            document.exitFullscreen().catch((err) => {
                console.error(`Error attempting to exit fullscreen mode: ${err.message} (${err.name})`);
            });
        }
        });
    });








// Dynamic Scrollable Text Height----------------------------------
// Also requires mutation observers in the tab logics--------------
function adjustHeight() {
    const elements = document.querySelectorAll('.scrollable-text-about, .scrollable-text-stories, .scrollable-text-timeline, .scrollable-text-c');
    const tenVH = window.innerHeight * 0.06; // 6% of the viewport height

    elements.forEach(element => {
        // Calculate the distance from the top of the element to the bottom of the viewport
        const rect = element.getBoundingClientRect();
        const distanceToBottom = window.innerHeight - rect.top;

        // Set the height of the element to that distance minus 10vh
        element.style.height = `${Math.max(distanceToBottom - tenVH, 0)}px`; // Ensure no negative heights

        // Optionally, set a max-height to prevent overflowing
        element.style.maxHeight = `${distanceToBottom - tenVH}px`;

        // Force a reflow to ensure the browser updates the layout
        element.offsetHeight; // Accessing this forces a reflow
    });
}

// Adjust on load, resize, and scroll
window.addEventListener('load', adjustHeight);
window.addEventListener('resize', adjustHeight);
window.addEventListener('scroll', adjustHeight);







// Rose Chart Refs
    const slides = document.querySelectorAll('.popup-slide');
    let currentIndex = 0;
    
    // Update slide visibility
    function updateSlides() {
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentIndex);
        });
    }
    
    // Navigation buttons
    document.getElementById('prevSlide').addEventListener('click', () => {
        currentIndex = (currentIndex === 0) ? slides.length - 1 : currentIndex - 1;
        updateSlides();
    });
    
    document.getElementById('nextSlide').addEventListener('click', () => {
        currentIndex = (currentIndex === slides.length - 1) ? 0 : currentIndex + 1;
        updateSlides();
    });
    
    // Initialize the first slide as active
    updateSlides();
    






// Layer toggle
const toggleButton = document.getElementById('toggle-material');
let isMaterialLayerActive = true; // Assume layer is active by default

toggleButton.addEventListener('click', function () {
    if (isMaterialLayerActive) {
        // Remove the layer from the map
        map.removeLayer(layerGroup);
        toggleButton.classList.remove('active'); // Update button style
        isMaterialLayerActive = false;
    } else {
        // Add the layer back to the map
        map.addLayer(layerGroup);
        toggleButton.classList.add('active'); // Update button style
        isMaterialLayerActive = true;
    }
});

