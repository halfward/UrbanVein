// Link controls - open new tab
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
});


// Panel collapse
function togglePanel(panelToggleId, panelContentId, panelTitleId) {
    document.getElementById(panelTitleId).addEventListener("click", function () {
        const panelContent = document.getElementById(panelContentId);
        const panelToggle = document.getElementById(panelToggleId);
        
        if (panelContent.classList.contains("hidden")) {
            panelContent.style.maxHeight = panelContent.scrollHeight + "px";
            panelContent.classList.remove("hidden");
        } else {
            panelContent.style.maxHeight = "0px";
            setTimeout(() => panelContent.classList.add("hidden"), 300); // Delay hiding fully after transition
        }
        
        panelToggle.classList.toggle("rotated");
        this.classList.toggle("collapsed");
    });
}

// Apply the toggle logic for each panel
togglePanel("panelToggleBuilding", "panelContentBuilding", "panelTitleBuilding");
togglePanel("panelToggleMaterial", "panelContentMaterial", "panelTitleMaterial");
togglePanel("panelToggleInfo", "panelContentInfo", "panelTitleInfo");

// Ensure specific panels start collapsed
document.addEventListener("DOMContentLoaded", function () {
    ["panelContentBuilding", "panelContentMaterial"].forEach((panelId) => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add("hidden");
            panel.style.maxHeight = "0px"; // Ensure transition works properly
        }
    });

    ["panelTitleBuilding", "panelTitleMaterial"].forEach((titleId) => {
        const title = document.getElementById(titleId);
        if (title) {
            title.classList.add("collapsed");
        }
    });

    ["panelToggleBuilding", "panelToggleMaterial"].forEach((toggleId) => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.classList.add("rotated");
        }
    });
});



// Material panel tooltip
const guideIcon = document.querySelector(".guide-icon");
const tooltip = document.getElementById("tooltip");

guideIcon.addEventListener("mouseenter", () => {
    tooltip.style.display = "block";
});

guideIcon.addEventListener("mousemove", (e) => {
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    // Position so the bottom-right corner sticks to the cursor
    tooltip.style.left = `${e.clientX - tooltipWidth}px`;
    tooltip.style.top = `${e.clientY - tooltipHeight}px`;
});

guideIcon.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
});






// Initialize the map-------------------------------------------------
let steelLayer = L.featureGroup().setZIndex(1);
let brickLayer = L.featureGroup().setZIndex(2);
let concreteLayer = L.featureGroup().setZIndex(3);
let glassLayer = L.featureGroup().setZIndex(4);
let stoneLayer = L.featureGroup().setZIndex(5);

let steelLayer200 = L.featureGroup().setZIndex(1);
let brickLayer200 = L.featureGroup().setZIndex(2);
let concreteLayer200 = L.featureGroup().setZIndex(3);
let glassLayer200 = L.featureGroup().setZIndex(4);
let stoneLayer200 = L.featureGroup().setZIndex(5);


const nycBounds = L.latLngBounds(
    [40.3774, -74.5591], // SW corner
    [41.0176, -73.4004]  // NE corner
);
const mainMap = L.map('mainMap', {
    center: [40.7128, -73.8860],
    zoom: 13,
    minZoom: 11,
    maxZoom: 19,
    renderer: L.canvas(),
    preferCanvas: true,
    maxBounds: nycBounds,
    maxBoundsViscosity: 1.0
});

L.control.scale({
    position: 'bottomleft',
    metric: true,
    imperial: true,
    maxWidth: 100
}).addTo(mainMap);

// Create a separate tile layer for the minimap (usually the same as main map)
const miniMapLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
});

// Create the minimap and add it to the main map
const miniMap = new L.Control.MiniMap(miniMapLayer, {
    toggleDisplay: true,
    minimized: false,
    position: 'bottomleft',
    width: 150,
    height: 150,
    zoomLevelOffset: -5  // Show a zoomed out view on the minimap
}).addTo(mainMap);

// Geocoder control
var geocoder = new L.Control.Geocoder({
    defaultMarkGeocode: false
}).on('markgeocode', function(e) {
    mainMap.setView(e.geocode.center, 14); // Adjust zoom level
});

// Add the geocoder to the map initially, then move it to the custom container
geocoder.addTo(mainMap);

// Wait for the geocoder control to be added, then move it
setTimeout(() => {
    var geocoderElement = document.querySelector('.leaflet-control-geocoder');
    if (geocoderElement) {
        geocoderElement.remove(); // Remove from the default location
        document.getElementById('custom-geocoder-container').appendChild(geocoder.getContainer()); // Move it to the custom container
    }
}, 100);




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
    steel: 'steel',
    brick: 'brick',
    concrete: 'concrete',
    glass: 'glass',
    stone: 'stone'
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


let geojsonData = null;
let isUsingDefaultRange = true;

const defaultRange = [0, 0.4, 0.8, 1.2, 1.6, 2, 2.4];
const alternateRange = [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2];

document.getElementById('toggleSize').addEventListener('click', () => {
    isUsingDefaultRange = !isUsingDefaultRange; // Toggle state
    updateMarkerSizes(); // Smoothly update sizes instead of redrawing
});

// Assuming `geojsonData` is already loaded
const updateMarkerSizes = () => {
    // if (!geojsonData) {
    //     console.warn("GeoJSON data not loaded yet.");
    //     return;
    // }

    // Determine which range to use
    const sizeRange = isUsingDefaultRange ? defaultRange : alternateRange;

    mainMap.eachLayer(layer => {
        // Check if the layer is a CircleMarker
        if (layer instanceof L.CircleMarker) {
            const material = layer.options.className.replace("leaflet-circle-", "");
            const columnName = materialColumns[material];

            // Find the corresponding feature for the material
            const feature = geojsonData.features.find(f => f.properties[columnName] >= 0);
            if (!feature) return;

            // Directly map the material value to the size range
            const materialValue = feature.properties[columnName];
            const newMultiplier = sizeRange[materialValue]; // Map material value to size range

            const baseRadius = 15;
            const minRadius = 5;
            const newRadius = Math.max(baseRadius * newMultiplier, minRadius);

            // Only update the radius if the new size is different
            if (layer.options.radius !== newRadius) {
                layer.setRadius(newRadius);
            }
        }
    });
};

// Call this function when toggling the range, or whenever you need to update the marker sizes
updateMarkerSizes();






// Function to add material markers to a given layer group (100)
const addMaterialMarkers = (geojsonData, material, color, columnName, layerGroup, offset = null, sizeRange = defaultRange) => {
    const filteredFeatures = geojsonData.features.filter(feature => feature.properties[columnName] > 0);
    const binnedDataValues = filteredFeatures.map(feature => feature.properties[columnName]);

    const quantiles = d3.scaleQuantile()
        .domain(binnedDataValues)
        .range(sizeRange);

    let index = 0;
    const batchSize = 1000; // Number of markers per batch

    function processBatch() {
        const batchEnd = Math.min(index + batchSize, filteredFeatures.length);

        for (; index < batchEnd; index++) {
            const feature = filteredFeatures[index];
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
        }

        if (index < filteredFeatures.length) {
            requestAnimationFrame(processBatch); // Schedule next batch
        } else {
            layerGroup.addTo(mainMap); // Add the layer group to the map after all markers are added
        }
    }

    processBatch();
};


// Function to add material markers to a given layer group (200)
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

// Function to check zoom level and toggle layers based on zoom level and state
function toggleLayersByZoom() {
    const currentZoom = mainMap.getZoom();

    // Check if zoom level is 11 or 12
    if (currentZoom === 11 || currentZoom === 12) {
        // Add the 200 layers based on their current state
        if (layerState.steel) steelLayer200.addTo(mainMap);
        if (layerState.brick) brickLayer200.addTo(mainMap);
        if (layerState.glass) glassLayer200.addTo(mainMap);
        if (layerState.concrete) concreteLayer200.addTo(mainMap);
        if (layerState.stone) stoneLayer200.addTo(mainMap);

        // Remove the 100 layers if zoomed out
        mainMap.removeLayer(steelLayer);
        mainMap.removeLayer(brickLayer);
        mainMap.removeLayer(glassLayer);
        mainMap.removeLayer(concreteLayer);
        mainMap.removeLayer(stoneLayer);
    } else {
        // Remove the 200 layers
        mainMap.removeLayer(steelLayer200);
        mainMap.removeLayer(brickLayer200);
        mainMap.removeLayer(glassLayer200);
        mainMap.removeLayer(concreteLayer200);
        mainMap.removeLayer(stoneLayer200);

        // Add the 100 layers based on their current state
        if (layerState.steel) steelLayer.addTo(mainMap);
        if (layerState.brick) brickLayer.addTo(mainMap);
        if (layerState.glass) glassLayer.addTo(mainMap);
        if (layerState.concrete) concreteLayer.addTo(mainMap);
        if (layerState.stone) stoneLayer.addTo(mainMap);
    }
}



// Load gzipped GeoJSON data for base 100 layers---------------------------------
fetch('data/centroid_data_100m_material.geojson.gz')
    .then(response => response.arrayBuffer())
    .then(buffer => {
        // Decompress the gzipped file using pako
        const decompressedData = pako.ungzip(new Uint8Array(buffer), { to: 'string' });

        // Parse the decompressed data as JSON
        const geojsonData = JSON.parse(decompressedData);

        // Process the GeoJSON data
        Object.keys(materialColumns).forEach(material => {
            addMaterialMarkers(
                geojsonData, 
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

        toggleLayersByZoom();
    })
    .catch(error => {
        console.error('Error loading and decompressing centroid GeoJSON:', error);
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

    // Call the function to check the zoom and toggle layers
    toggleLayersByZoom();

}).catch(error => {
    console.error('Error loading 200-layer GeoJSON:', error);
});

// Initialize map zoom event listener to toggle layers based on zoom level
mainMap.on('zoomend', toggleLayersByZoom);





// Toggle material on/off states----------------------------------------------
// Update layer visibility based on state
function updateLayerVisibility() {
    Object.keys(layerState).forEach(material => {
        if (layerState[material]) {
            // Add the layer if it's set to true
            switch (material) {
                case 'steel':
                    steelLayer.addTo(mainMap);
                    steelLayer200.addTo(mainMap);
                    break;
                case 'brick':
                    brickLayer.addTo(mainMap);
                    brickLayer200.addTo(mainMap);
                    break;
                case 'glass':
                    glassLayer.addTo(mainMap);
                    glassLayer200.addTo(mainMap);
                    break;
                case 'concrete':
                    concreteLayer.addTo(mainMap);
                    concreteLayer200.addTo(mainMap);
                    break;
                case 'stone':
                    stoneLayer.addTo(mainMap);
                    stoneLayer200.addTo(mainMap);
                    break;
            }
        } else {
            // Remove the layer if it's set to false
            switch (material) {
                case 'steel':
                    mainMap.removeLayer(steelLayer);
                    mainMap.removeLayer(steelLayer200);
                    break;
                case 'brick':
                    mainMap.removeLayer(brickLayer);
                    mainMap.removeLayer(brickLayer200);
                    break;
                case 'glass':
                    mainMap.removeLayer(glassLayer);
                    mainMap.removeLayer(glassLayer200);
                    break;
                case 'concrete':
                    mainMap.removeLayer(concreteLayer);
                    mainMap.removeLayer(concreteLayer200);
                    break;
                case 'stone':
                    mainMap.removeLayer(stoneLayer);
                    mainMap.removeLayer(stoneLayer200);
                    break;
            }
        }
    });
    enforceLayerOrder();
    // Ensure correct layers are visible based on zoom
    toggleLayersByZoom();
}
// Function to enforce the correct z-index order
function enforceLayerOrder() {
    steelLayer.bringToFront();
    steelLayer200.bringToFront();

    brickLayer.bringToFront();
    brickLayer200.bringToFront();

    concreteLayer.bringToFront();
    concreteLayer200.bringToFront();

    glassLayer.bringToFront();
    glassLayer200.bringToFront();

    stoneLayer.bringToFront();
    stoneLayer200.bringToFront();
}

const layerKeys = ["brick", "concrete", "glass", "stone", "steel"];

// Loop through toggles and attach event listeners
layerKeys.forEach((key, index) => {
    document.getElementById(`toggle${index + 1}`).addEventListener("change", function() {
        layerState[key] = this.checked;  // Update state dynamically
        updateLayerVisibility();  // Apply new layer state
    });
});



// On page load, add layers based on initial state
document.addEventListener('DOMContentLoaded', function() {
    updateLayerVisibility();  // Apply the default layer visibility
    toggleLayersByZoom();  // Apply the correct zoom levels
});




// X-ray mask div-----------------------------------------------------
// Initialize the X-ray map inside the mask
let xrayMap = L.map("xray-map", {
    center: mainMap.getCenter(),
    zoom: mainMap.getZoom(),
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    interactive: false,  // Ensures it doesn't interfere with user actions
});



// Define tile layers
const xraySatelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
    {
        attribution: 'Tiles &copy; Esri',
    }
);
const xrayEsriLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', 
    {
        attribution: 'Tiles &copy; Esri',
    }
);


// Define zoning layer (GeoJSON)
let xrayZoningLayer; // Declare globally for toggle functionality

fetch('data/nyzd.geojson.gz')
    .then(response => response.arrayBuffer()) // Get the binary data as an array buffer
    .then(data => {
        // Decompress the data using pako
        const decompressedData = pako.inflate(data, { to: 'string' });
        
        // Parse the decompressed JSON into an object
        const geoJsonData = JSON.parse(decompressedData);
        
        // Function to determine fill color based on ZONEDIST property
        const getFillColor = (zonedist) => {
            if (!zonedist) return 'transparent'; // Handle undefined values
            zonedist = zonedist.trim(); // Remove extra spaces
            if (zonedist.startsWith('R')) return 'gold';
            if (zonedist.startsWith('C')) return 'tomato';
            if (zonedist.startsWith('M')) return 'violet';
            if (zonedist.startsWith('P')) return 'yellowgreen';
            return 'transparent';
        };

        // Initialize the GeoJSON layer (but do not add to map yet)
        xrayZoningLayer = L.geoJSON(geoJsonData, {
            style: (feature) => {
                const fillColor = getFillColor(feature.properties.ZONEDIST);
                return {
                    weight: 1,                  // Border weight
                    color: fillColor,           // Border color
                    fillColor: fillColor,       // Fill color
                    fillOpacity: 0.7,
                    interactive: false 
                };
            }
        });
    })
    .catch(error => console.error('Error loading or decompressing GeoJSON:', error));


// Define subway layers (GeoJSON)
let xraySubwayLayer, xraySubwayStationsLayer; // Declare globally for toggle functionality

fetch('data/subwayLines.geojson')
    .then(response => response.json())
    .then(data => {
        // NYC Subway Colors by MTA Line Symbols
        const subwayColors = {
            "1": "#EE352E", "2": "#EE352E", "3": "#EE352E", // Red
            "4": "#00933C", "5": "#00933C", "6": "#00933C", // Green
            "7": "#B933AD", // Purple
            "A": "#0039A6", "C": "#0039A6", "E": "#0039A6", // Blue
            "B": "#FF6319", "D": "#FF6319", "F": "#FF6319", "M": "#FF6319", // Orange
            "G": "#6CBE45", // Light Green
            "J": "#996633", "Z": "#996633", // Brown
            "L": "#A7A9AC", // Gray
            "N": "#FCCC0A", "Q": "#FCCC0A", "R": "#FCCC0A", // Yellow
            "S": "#808183"  // Dark Gray (Shuttle)
        };

        // Initialize the Subway Lines Layer
        xraySubwayLayer = L.geoJSON(data, {
            style: (feature) => {
                const lineSymbol = feature.properties.rt_symbol;
                const color = subwayColors[lineSymbol] || "#000000"; // Default black if undefined
                return {
                    weight: 3,          // Line thickness
                    color: color,       // Subway line color
                    opacity: 1,         
                    fillOpacity: 0,     
                    fillColor: 'transparent',
                    interactive: false 
                };
            }
        });

        // Load and add subway stations
        fetch('data/subwayStations.geojson')
            .then(response => response.json())
            .then(stationData => {
                xraySubwayStationsLayer = L.geoJSON(stationData, {
                    pointToLayer: (feature, latlng) => {
                        return L.circleMarker(latlng, {
                            radius: 5,       // Circle size
                            fillColor: "#FFFFFF", // White fill
                            color: "#000000",     // Black border
                            weight: 2,      // Border thickness
                            opacity: 1,    
                            fillOpacity: 1,
                            interactive: false 
                        });
                    }
                });
            })
            .catch(error => console.error('Error loading subway stations:', error));
    })
    .catch(error => console.error('Error loading subway lines:', error));




// Define bus routes layer (GeoJSON)
let xrayBusLayer; // Declare globally for toggle functionality

fetch('data/busLines.geojson.gz') 
    .then(response => response.arrayBuffer())  // Get the binary data as an ArrayBuffer
    .then(data => {
        const decompressedData = pako.inflate(data, { to: 'string' });
        const geoJsonData = JSON.parse(decompressedData);

        xrayBusLayer = L.geoJSON(geoJsonData, {
            style: (feature) => {
                const routeColor = feature.properties.color || "#000000"; // Default to black if undefined
                return {
                    weight: 2,               // Line thickness
                    color: routeColor,       // Line color from GeoJSON data
                    opacity: 1,              // Full visibility
                    fillOpacity: 0,           // No fill for bus lines
                    interactive: false 
                };
            }
        })
    })
    .catch(error => console.error('Error loading or decompressing bus GeoJSON:', error));



// Get x-ray elements
let xrayMask = document.getElementById("xray-mask");
let xrayLegend = document.getElementById("xray-legend");
let xrayControl = document.querySelector(".sml-container");
let xrayMapElement = document.getElementById("xray-map"); 

// 1. Position the xray map overlay statically on top of the main map
function positionXrayMapOverlay() {
    // Get main map container position and dimensions
    const mainMapContainer = mainMap.getContainer();
    const mainMapRect = mainMapContainer.getBoundingClientRect();
    
    // Position the xray map element to fully cover the main map
    xrayMapElement.style.position = "absolute";
    xrayMapElement.style.left = `${mainMapRect.left}px`;
    xrayMapElement.style.top = `${mainMapRect.top}px`;
    xrayMapElement.style.width = `${mainMapRect.width}px`;
    xrayMapElement.style.height = `${mainMapRect.height}px`;
    xrayMapElement.style.zIndex = "-1";
    
    // Set the xray map to initially be fully hidden/clipped
    xrayMapElement.style.clipPath = "inset(100% 100% 100% 100% round 15px)";
    xrayMapElement.style.webkitClipPath = "inset(100% 100% 100% 100% round 15px)";
    
    // Make sure the maps are synced
    xrayMap.setView(mainMap.getCenter(), mainMap.getZoom());
}

// 2. Make xray map pass through pointer events when not in active region
function setupPointerEventHandling() {
    xrayMapElement.style.pointerEvents = "none";

    // Create a style element to add a new CSS class
    const styleElement = document.createElement('style');
    document.head.appendChild(styleElement);
}

// 3. Sync maps when main map is moved
mainMap.on('move', function() {
    xrayMap.setView(mainMap.getCenter(), mainMap.getZoom());
});

// 4. Updated mouse movement handler for rounded square reveal window
document.addEventListener("mousemove", function (e) {
    if (xrayMask.style.display === "block") {
        // Get mouse position relative to page
        const mouseX = e.pageX;
        const mouseY = e.pageY;
        
        // Size of the reveal window (adjust as needed)
        const revealSize = 350;
        const cornerRadius = 15;
        
        // Update the clip path to create a rounded square reveal window
        xrayMapElement.style.clipPath = `inset(
            calc(${mouseY}px - ${revealSize / 2}px) 
            calc(100% - ${mouseX}px - ${revealSize / 2}px) 
            calc(100% - ${mouseY}px - ${revealSize / 2}px) 
            calc(${mouseX}px - ${revealSize / 2}px)
            round ${cornerRadius}px
        )`;
        xrayMapElement.style.webkitClipPath = `inset(
            calc(${mouseY}px - ${revealSize / 2}px) 
            calc(100% - ${mouseX}px - ${revealSize / 2}px) 
            calc(100% - ${mouseY}px - ${revealSize / 2}px) 
            calc(${mouseX}px - ${revealSize / 2}px)
            round ${cornerRadius}px
        )`;
        
        // Position legend near cursor if visible
        if (xrayLegend.style.display === "block") {
            xrayLegend.style.left = `${mouseX - revealSize / 2}px`;
            xrayLegend.style.top = `${mouseY + revealSize / 2 - 10}px`;
        }
    }
});

// 5. Updated function to update X-ray mode
function updateXray(mode) {
    if (mode === "none") {
        xrayMask.style.display = "none";
        xrayLegend.style.display = "none";
        xrayMap.eachLayer(layer => xrayMap.removeLayer(layer));
        // Hide the xray map completely
        xrayMapElement.style.clipPath = "inset(100% 100% 100% 100% round 15px)";
        xrayMapElement.style.webkitClipPath = "inset(100% 100% 100% 100% round 15px)";
        xrayMarkers.forEach(marker => mainMap.removeLayer(marker));
    } else {
        // Position the overlay map first
        positionXrayMapOverlay();
        
        xrayMask.style.display = "block";
        xrayLegend.style.display = "none";
        xrayMap.eachLayer(layer => xrayMap.removeLayer(layer));
        
        // Add the appropriate layer based on mode
        if (mode === "satellite") {
            xraySatelliteLayer.addTo(xrayMap);
            // xrayMarkers.forEach(marker => marker.addTo(xrayMap));
        } else if (mode === "esri-topo") {
            xrayEsriLayer.addTo(xrayMap);
            // xrayMarkers.forEach(marker => marker.addTo(xrayMap));
        } else if (mode === "subway") {
            xraySubwayLayer.addTo(xrayMap);
            xraySubwayStationsLayer.addTo(xrayMap);
            // xrayMarkers.forEach(marker => marker.addTo(mainMap));
        } else if (mode === "bus") {
            xrayBusLayer.addTo(xrayMap);
            // xrayMarkers.forEach(marker => marker.addTo(mainMap));
        } else if (mode === "zoning") {
            if (xrayZoningLayer) {
                xrayZoningLayer.addTo(xrayMap);
                xrayLegend.style.display = "block";
                // xrayMarkers.forEach(marker => marker.addTo(mainMap));
            }
        }
        
        // Force Leaflet to redraw tiles
        setTimeout(() => {
            xrayMap.invalidateSize();
        }, 100);
    }
}

// 6. Initialize the overlay on page load
window.addEventListener('load', function() {
    // Set up initial state
    positionXrayMapOverlay();
    setupPointerEventHandling();
    
    // Additionally handle window resize to reposition
    window.addEventListener('resize', positionXrayMapOverlay);
    
    // Sync maps when main map is zoomed
    mainMap.on('zoom', function() {
        xrayMap.setView(mainMap.getCenter(), mainMap.getZoom());
    });
});





// Get dropdown elements
let mapDropdown = document.getElementById("map-dropdown");
let planningDropdown = document.getElementById("planning-dropdown");
let transportDropdown = document.getElementById("transport-dropdown");

// Ensure all dropdown texts are initially grey
document.querySelectorAll(".dropdown-selected").forEach(el => {
    el.style.color = "grey"; // Set default grey color
});

// Set "none" button as active by default
let noneButton = document.querySelectorAll(".label-xray");
noneButton.forEach((button) => {
    button.classList.add("active"); 
});

// Function to reset all dropdowns
function resetDropdowns(except = null) {
    document.querySelectorAll(".custom-dropdown").forEach(dropdown => {
        if (dropdown !== except) {
            let selectedText = dropdown.querySelector(".dropdown-selected");
            selectedText.textContent = selectedText.dataset.default; // Reset text to default
            selectedText.style.color = "grey"; // Reset text color to grey
            dropdown.dataset.value = ""; // Clear stored value
        }
    });

    // Reset "none" button state
    if (!except) {
        noneButton.classList.add("active");
    } else {
        noneButton.classList.remove("active");
    }
}

// Function to reset X-ray and dropdown selections
function resetXray() {
    updateXray("none"); // Turn off X-ray
    resetDropdowns(); // Reset all dropdowns
}

// Add event listener to 'none' button
noneButton.forEach((button) => {
    button.addEventListener("click", function () {
        resetXray();

        // Remove "active" from all buttons first (optional, if you want only one to be active at a time)
        noneButton.forEach((btn) => btn.classList.remove("active"));

        // Ensure the clicked button stays active
        button.classList.add("active");
    });
});

// Handle dropdown selection
document.querySelectorAll(".dropdown-option").forEach(option => {
    option.addEventListener("click", function () {
        let dropdown = this.closest(".custom-dropdown");
        let selectedText = dropdown.querySelector(".dropdown-selected");

        resetDropdowns(dropdown); // Reset all other dropdowns

        selectedText.textContent = this.textContent; // Update visible text
        dropdown.dataset.value = this.dataset.value; // Store selected value

        // Highlight only the active dropdown text
        selectedText.style.color = "black";

        // Ensure layer icon visibility by adding "active" class
        let layerIcon = dropdown.querySelector(".layer-icon");
        if (layerIcon) {
            layerIcon.classList.add("active");
        }

        updateXray(this.dataset.value); // Trigger X-ray update

        // Remove "none" active state for all noneButtons
        let noneButton = document.querySelectorAll(".label-xray");
        noneButton.forEach((button) => {
            button.classList.remove("active");
        });
    });
});


// Reset function should remove active class from icons too
function resetDropdowns(except = null) {
    // Select all dropdowns and reset their content
    document.querySelectorAll(".custom-dropdown").forEach(dropdown => {
        if (dropdown !== except) {
            let selectedText = dropdown.querySelector(".dropdown-selected");
            selectedText.textContent = selectedText.dataset.default;
            selectedText.style.color = "grey";  // Set text color back to grey

            let layerIcon = dropdown.querySelector(".layer-icon");
            if (layerIcon) {
                layerIcon.classList.remove("active");
            }

            dropdown.dataset.value = "";
        }
    });

    // Select all elements with class "label-xray"
    let noneButton = document.querySelectorAll(".label-xray");

    // Loop through all "noneButtons" and update their state
    noneButton.forEach((button) => {
        if (!except) {
            button.classList.add("active"); // Add "active" class if no dropdown is excepted
        } else {
            button.classList.remove("active"); // Remove "active" class if one dropdown is excepted
        }
    });
}



// Handle hover delay
let dropdowns = document.querySelectorAll(".custom-dropdown");

dropdowns.forEach(dropdown => {
    let timeout;

    dropdown.addEventListener("mouseenter", () => {
        timeout = setTimeout(() => {
            dropdown.classList.add("show-options");
        }, 100); // 0.1s delay
    });

    dropdown.addEventListener("mouseleave", () => {
        clearTimeout(timeout);
        dropdown.classList.remove("show-options");
    });
});

// Store default text for resetting
document.querySelectorAll(".dropdown-selected").forEach(el => {
    el.dataset.default = el.textContent;
});




// X-ray layer remove appearance
document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll(".custom-dropdown");
    const labelXray = document.querySelectorAll(".label-xray"); // Select all label-xray buttons

    dropdowns.forEach((dropdown) => {
        const selected = dropdown.querySelector(".dropdown-selected");
        const options = dropdown.querySelectorAll(".dropdown-option");

        options.forEach((option) => {
            option.addEventListener("click", function () {
                // Remove 'expanded' class from all dropdowns
                dropdowns.forEach((d) => d.classList.remove("expanded"));

                // Update selected text
                selected.textContent = this.textContent;

                // Expand only the parent dropdown of the selected option
                dropdown.classList.add("expanded");
            });
        });
    });

    // Remove 'expanded' class from all dropdowns when clicking on any '.label-xray'
    labelXray.forEach((button) => {
        button.addEventListener("click", function () {
            dropdowns.forEach((d) => d.classList.remove("expanded"));
        });
    });
});


// X-ray dropdown--------------------
document.querySelectorAll('input[name="options"]').forEach(radio => {
    radio.addEventListener('change', function() {
        document.getElementById("transport-dropdown").value = this.value;
    });
});





// Marker layer--------------------------------------------------------
// Create an empty layer group for markers
let markerMap = L.layerGroup();

// Load GeoJSON data
fetch('data/marker-data-20250311-a.geojson')
    .then(response => response.json())
    .then(data => {
        data.features.forEach(feature => {
            let properties = feature.properties;
            
            // Check if 'marker-latlon' exists and is correctly formatted
            if (!properties['marker-latlon'] || !properties['marker-latlon'].includes(',')) {
                return; // Skip this feature
            }
            
            let [lng, lat] = properties['marker-latlon'].split(',').map(coord => parseFloat(coord.trim()));
            
            // Ensure parsed lat/lng are valid numbers
            if (isNaN(lat) || isNaN(lng)) {
                console.warn('Invalid lat/lng values for feature:', properties);
                return;
            }

            // Function to get background color based on material
            function getMaterialColor(material) {
                const colors = {
                    brick: '#ff785a',
                    concrete: '#ccef07',
                    glass: '#49fcd7',
                    stone: '#60bdff',
                    steel: '#ec49fd'
                };
                return colors[material.toLowerCase()] || '#fff'; // Default to white if not found
            }

            // Split materials by commas and create a flex row
            let materialsArray = properties.materials ? properties.materials.split(',').map(material => material.trim()) : [];
            let materialsHtml = materialsArray.map(material => {
                let backgroundColor = getMaterialColor(material);
                return `<div class="material" style="background-color: ${backgroundColor};">${material}</div>`;
            }).join('');

            // Create marker info HTML
            let markerHtml = ` 
                <div class="xray-marker" id="marker-${properties.Name.replace(/\s+/g, '-').toLowerCase()}">
                    <div class="xray-marker-icon"></div>
                    <div class="xray-marker-info">
                        <div class="marker-header">
                            <div class="marker-name">${properties.Name}</div>
                            <div class="marker-spacing"></div>
                            <div class="marker-materials" style="display: flex; flex-wrap: wrap; gap: 5px;">
                                ${materialsHtml}
                            </div>
                        </div>
                        <div class="marker-story">${properties.story}</div>
                        <div class="marker-references">
                            See: 
                            <a href="${properties['refA-link']}" target="_blank">${properties['refA-name']}</a>`;

            // Check if the second reference link exists before adding it
            if (properties['refB-link']) {
                markerHtml += `, <a href="${properties['refB-link']}" target="_blank">${properties['refB-name']}</a>`;
            }
            
            markerHtml += `</div></div></div>`;

            // Create the marker
            let marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: "custom-xray-marker",
                    html: markerHtml,
                    iconSize: [30, 30],
                    iconAnchor: [30, 30],
                    zIndexOffset: 1001
                }),
                interactive: true 
            });

            // Store reference to the GeoJSON shape associated with the marker
            let shapeLayer = L.geoJSON(feature.geometry, {
                style: {
                    color: 'transparent',  // Initially no border color
                    fillOpacity: 0,        // No fill color
                    weight: 2              // Border width (but it's transparent initially)
                }
            }).addTo(markerMap);

            // Hover event to highlight the shape's border on marker hover
            marker.on("mouseover", function () {
                // Change the border color of the shape to black on hover
                shapeLayer.setStyle({ color: 'black', weight: 2, fillOpacity: 1, fill: 'black' });

            });

            marker.on("mouseout", function () {
                // Reset the border color of the shape back to transparent on mouse out
                shapeLayer.setStyle({ color: 'transparent', weight: 2 });

            });

            markerMap.addLayer(marker);
        });
    })
    .catch(error => console.error('Error loading GeoJSON:', error));



// Ensure markerMap is rendered on top
markerMap.getPane = function () {
    let pane = mainMap.getPane('markerPane');
    if (!pane) {
        pane = mainMap.createPane('markerPane');
        pane.style.zIndex = '9999';
    }
    return pane;
};

mainMap.addLayer(markerMap);















// Mini maps--------------------------------
// Initialize Mini Esri Map
let esriMap = L.map("esri-preview", {
    center: mainMap.getCenter(),
    zoom: 17,
    zoomSnap: 0, // Allow fractional zoom levels
    zoomDelta: 0.1,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    interactive: false,
});
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA'
}).addTo(esriMap);

// Initialize Mini Satellite Map
let satelliteMap = L.map("satellite-preview", {
    center: mainMap.getCenter(),
    zoom: mainMap.getZoom(),
    zoomSnap: 0, // Allow fractional zoom levels
    zoomDelta: 0.1,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    interactive: false,
});
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
}).addTo(satelliteMap);

// Update previews based on cursor movement
mainMap.on("mousemove", function (e) {
    let cursorLatLng = e.latlng;
    esriMap.setView(cursorLatLng, 17.25);
    satelliteMap.setView(cursorLatLng, 17.25);
});







// Geojson background----------------------------------------------
fetch('data/NY+NJ_Shoreline.geojson.gz')
        .then(response => response.arrayBuffer())  // Get the binary data as an ArrayBuffer
        .then(data => {
            // Decompress the data using pako
            const decompressedData = pako.inflate(data, { to: 'string' });
            
            // Parse the decompressed JSON into an object
            const geoJsonData = JSON.parse(decompressedData);

            // Create a custom pane for the GeoJSON layer
            const blurPane = mainMap.createPane('blurPane');
            blurPane.style.zIndex = 10;  // Adjust z-index to place behind interactive layers
            blurPane.style.pointerEvents = 'none';  // Allow interactions to pass through

            // Add the GeoJSON layer to the custom pane
            const coastlineLayer = L.geoJSON(geoJsonData, {
                style: {
                    weight: 0,              // No border
                    fillColor: 'white',     // Use a default color
                    fillOpacity: 0.5        // Semi-transparent fill
                },
                pane: 'blurPane'           // Attach to the custom pane
            }).addTo(mainMap);

            // Bring the GeoJSON layer to the back
            coastlineLayer.bringToBack();
        })
        .catch(error => console.error('Error loading or decompressing GeoJSON:', error));





// Zonedist overflow scrolling effect--------------------------
document.addEventListener("DOMContentLoaded", function () {
    const zonedistDiv = document.getElementById("zonedist");

    if (!zonedistDiv) {
        console.error("Element with ID 'zonedist' not found.");
        return;
    }

    // Function to check if the text overflows and start scrolling
    function startScrolling() {
        const textContent = zonedistDiv.textContent.trim();

        if (!textContent) return; // Ensure there is text to scroll

        // Check if the content overflows the parent container
        const textWidth = zonedistDiv.scrollWidth;
        const containerWidth = zonedistDiv.clientWidth;

        if (textWidth > containerWidth) {
            // Apply scrolling effect by setting animation on the span (not the div)
            if (!zonedistDiv.classList.contains("scrolling")) {
                zonedistDiv.classList.add("scrolling");
            }
        } else {
            // Remove scrolling effect if no overflow
            zonedistDiv.classList.remove("scrolling");
        }
    }

    // Run check on page load
    setTimeout(startScrolling, 500);

    // Check periodically if the content changes or if scrolling should start
    setInterval(startScrolling, 1000);
});







// Traffic lights: Toggle -------------------------------------------
// Function to handle toggle changes for radar rings and radar base
function handleToggle(toggleId, radarRingClass, radarRingMaterial, radarBaseId) {
    document.getElementById(toggleId).addEventListener('change', function () {
        // Get the radar ring element
        const radarRing = document.querySelector(`.${radarRingClass}.${radarRingMaterial}`);
        // Get the radar base element by ID
        const radarBase = document.getElementById(radarBaseId);

        if (radarRing && radarBase) {
            if (!this.checked) {
                radarRing.classList.add('inactive');  // Add 'inactive' to the radar ring when unchecked
                radarBase.classList.add('inactive');  // Add 'inactive' to the radar base when unchecked
            } else {
                radarRing.classList.remove('inactive');  // Remove 'inactive' from the radar ring when checked
                radarBase.classList.remove('inactive');  // Remove 'inactive' from the radar base when checked
            }
        }
    });
}

// Assign handlers for each toggle based on the HTML structure
handleToggle('toggle1', 'radar-ring', 'brick', 'radar-brick');   // Brick
handleToggle('toggle2', 'radar-ring', 'concrete', 'radar-concrete'); // Concrete
handleToggle('toggle3', 'radar-ring', 'glass', 'radar-glass');    // Glass
handleToggle('toggle4', 'radar-ring', 'stone', 'radar-stone');    // Stone
handleToggle('toggle5', 'radar-ring', 'steel', 'radar-steel');    // Steel




// Traffic lights Update, & Hex tile info update -------------------------------------------
var layer1 = L.geoJSON(null, {
    style: () => ({
        opacity: 0,
        fillOpacity: 0,
        weight: 0,
        dashArray: '0',
        color: 'transparent'
    })
}).addTo(mainMap);

let quantiles = {};
let materialTypes = ["brick", "concrete", "glass", "stone", "steel"];

// Throttle function
function throttle(callback, delay) {
    let lastTime = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            lastTime = now;
            callback(...args);
        }
    };
}

fetch('data/tile_data_100m_20250304.geojson.gz')
    .then(response => response.arrayBuffer())  // Fetch the gzipped file as an array buffer
    .then(buffer => {
        const decompressed = pako.ungzip(new Uint8Array(buffer), { to: 'string' });  // Decompress the gzipped data
        const data = JSON.parse(decompressed);  // Parse the decompressed string as JSON

        // Initialize quantiles based on material types
        materialTypes.forEach((material, index) => {
            let values = data.features.map(f => f.properties.material_profile[index]).filter(v => v !== null && v !== undefined);
            quantiles[material] = [0, 1, 2, 3, 4, 5];  // Define quantiles (example)
        });

        function getSizeCategory(value, material) {
            if (value === null || value === 0) return "0%";
            let breaks = quantiles[material];
            if (value === breaks[1]) return "20%";
            if (value === breaks[2]) return "40%";
            if (value === breaks[3]) return "60%";
            if (value === breaks[4]) return "80%";
            return "100%";
        }

        function formatNumber(num) {
            if (num === null || num === 0) {
                return "-";
            } else {
                return num.replace("_", " ");  // Replace underscores with spaces
            }
        }

        function resetRadarSizes() {
            materialTypes.forEach(material => {
                document.getElementById(`radar-${material}`).style.width = "0%";
            });
        }

        function updateRadarSizes(feature) {
            materialTypes.forEach((material, index) => {
                let value = feature.properties.material_profile[index];
                let size = value !== null && value !== undefined ? getSizeCategory(value, material) : "0%";
                document.getElementById(`radar-${material}`).style.width = size;
            });
        }

        let lastFeature = null;
        let animationFrameId = null;

        // Mouseover handler with throttling applied
        function onEachFeatureHandler(feature, layer) {
            // Mouseover handler
            layer.on('mouseover', function (e) {
                let targetLayer = e.target;
                targetLayer.bringToFront(); // Move to top
                
                // Throttle the style update separately (100ms)
                handleStyleUpdate(e);
                
                // Throttle data updates separately (300ms)
                handleMouseOver(e);
            });
        
            // Throttled function for immediate style update (100ms)
            const handleStyleUpdate = throttle(function (e) {
                let targetLayer = e.target;
                targetLayer.setStyle({
                    color: "black", 
                    weight: 2,
                    opacity: 1
                });
            }, 100);
        
            // Throttled function for updating values (300ms)
            const handleMouseOver = throttle(function (e) {
                let targetLayer = e.target;
                
                // Define the materials and their corresponding IDs
                const materials = {
                    "value-brick": feature.properties.material_value[0],
                    "value-concrete": feature.properties.material_value[1],
                    "value-glass": feature.properties.material_value[2],
                    "value-stone": feature.properties.material_value[3],
                    "value-steel": feature.properties.material_value[4]
                };
        
                // Loop through the materials object and update the textContent for each ID
                Object.entries(materials).forEach(([id, value]) => {
                    document.getElementById(id).textContent = formatNumber(value);
                });
        
                // Get all relevant properties
                const props = feature.properties;
        
                // Define a mapping of property names to element IDs
                const fields = {
                    "borough": props.Borough,
                    "zonedist": props.ZoneDist,
                    "builtfar": `${props.BuiltFAR_Mean} / ${props.BuiltFAR_Median}`,
                    "numfloors": `${props.NumFloors_Mean} / ${props.NumFloors_Median}`,
                    "yearbuilt": `${props.YearBuilt_Mean} / ${props.YearBuilt_Median}`,
                    "elev_mean": `${props.Elev_Mean}ft / ${(props.Elev_Mean * 0.3048).toFixed(1)}m`,
                    "bedrock_mean": `${props.Bedrock_Mean}ft / ${(props.Bedrock_Mean * 0.3048).toFixed(1)}m`
                };
        
                // Update all elements in a single loop
                Object.entries(fields).forEach(([id, value]) => {
                    document.getElementById(id).innerHTML = value;
                });
        
                // Trigger a radar size update using requestAnimationFrame
                lastFeature = feature;
                cancelAnimationFrame(animationFrameId);  // Cancel any previous requestAnimationFrame
                animationFrameId = requestAnimationFrame(() => updateRadarSizes(lastFeature));  // Schedule update
            }, 300); // 300ms throttle interval
        
            // Mouseout handler
            layer.on('mouseout', function (e) {
                e.target.bringToBack(); // Move back to original order
                e.target.setStyle({
                    color: "transparent",
                    weight: 1,
                    opacity: 0
                });
                resetRadarSizes();
            });        

            // Mouseover handler with throttled behavior
            layer.on('mouseover', function (e) {
                handleMouseOver(e); // Trigger the throttled mouseover function
            });

            // Mouseout handler
            layer.on('mouseout', function (e) {
                e.target.bringToBack(); // Move back to original order
                e.target.setStyle({
                    color: "transparent",
                    weight: 1,
                    opacity: 0
                });
                resetRadarSizes();
            });
        }

        function addGeoJSONLayer(data, layer) {
            L.geoJSON(data, {
                style: () => ({
                    opacity: 0,
                    fillOpacity: 0,
                    weight: 0,
                    dashArray: '0',
                    color: 'transparent'
                }),
                onEachFeature: onEachFeatureHandler
            }).addTo(layer);
        }

        addGeoJSONLayer(data, layer1); // Add the GeoJSON layer to the map
    });









// Intro------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    const intro = document.getElementById("intro");
    const exitButton = document.getElementById("intro-exit");
    const exitButton2 = document.getElementById("intro-exit-2");
    const controlDoc = document.querySelector(".control-doc");

    if (controlDoc) {
        controlDoc.addEventListener("click", function () {
            intro.classList.add("expanded"); // Expand intro
        });
    }

    if (exitButton) {
        exitButton.addEventListener("click", function () {
            intro.classList.remove("expanded"); // Collapse intro
        });
    }

    if (exitButton2) {
        exitButton2.addEventListener("click", function () {
            intro.classList.remove("expanded"); // Collapse intro
        });
    }
});

// Version History------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    const versionHistory = document.getElementById("version-history");
    const historyButton = document.getElementById("historyButton");
    const exitButton = document.getElementById("version-history-exit");
    
    // Expand version history on button click
    if (historyButton) {
        historyButton.addEventListener("click", function () {
            versionHistory.classList.add("expanded");
        });
    }

    // Collapse version history on exit button click
    if (exitButton) {
        exitButton.addEventListener("click", function () {
            versionHistory.classList.remove("expanded");
        });
    }

    // Fetch and display content from version_history.txt
    fetch("articles/version_history.txt")
        .then(response => response.text())
        .then(text => {
            const contentContainer = document.querySelector("#version-history .version-history-content");
            contentContainer.innerHTML = marked.parse(text);  // You can use any markdown parser like marked
        });
});



// Intro chapters---------------------------
document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".chapter-button");
    const sections = document.querySelectorAll(".chapter-section");

    // Smooth scrolling when clicking a button
    buttons.forEach(button => {
        button.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    // Intersection Observer to highlight active button
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.2, // Adjust for better sensitivity
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                buttons.forEach(btn => btn.classList.remove("active")); // Remove active from all
                const activeButton = document.querySelector(`.chapter-button[data-target="${entry.target.id}"]`);
                if (activeButton) {
                    activeButton.classList.add("active");
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
});






// Sidebar------------------------------------------------------
document.addEventListener("DOMContentLoaded", function() {
    let isSidebarExpanded = true; // Sidebar starts expanded

    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("control-toggle");
    const toggleIcon = document.getElementById("toggleIcon");

    // Ensure sidebar starts expanded
    sidebar.classList.add("expanded"); 
    toggleIcon.src = "images/panel-collapse.svg"; // Show collapse icon

    toggleButton.addEventListener("click", function() {
        if (isSidebarExpanded) {
            sidebar.classList.remove("expanded"); // Collapse
            toggleIcon.src = "images/panel-expand.svg"; // Change icon to expand
        } else {
            sidebar.classList.add("expanded"); // Expand
            toggleIcon.src = "images/panel-collapse.svg"; // Change icon to collapse
        }
        isSidebarExpanded = !isSidebarExpanded;
    });
});

// Version History-------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const versionHistoryLink = document.getElementById('versionHistoryLink');

    // Fetch version history to update link text
    function updateVersionHistory() {
        fetch('articles/version_history.txt')
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
                if (lines[i].startsWith('0')) {
                    // Extract the version text and remove the date if present
                    firstVersion = lines[i].split('(')[0].trim();
                    console.log('version', firstVersion); // Debug log
                    break; 
                }
            }

            const versionHistoryLink = document.getElementById('versionHistoryLink');
            if (versionHistoryLink && firstVersion) {
                versionHistoryLink.textContent = firstVersion;
            } else {
                console.warn('Version history link element not found or no version found');
            }
        })
        .catch(error => {
            console.error('Error fetching version history:', error);
        });
    }
    updateVersionHistory();
});

// Nav Button-------------------------------------------------------
// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {
    const buttons = document.querySelectorAll('.nav-button');
    const line = document.createElement('div'); // Create line element
    document.getElementById('sidebar').appendChild(line); // Append to sidebar

    // Position line initially under the explorer button
    const initialButton = document.getElementById('referencesButton');
    line.style.width = `${initialButton.offsetWidth - 10}px`; // Set width
    line.style.position = 'absolute';
    line.style.bottom = '-5px'; // Position it
    line.style.left = `${initialButton.offsetLeft + 5}px`; // Align with explorer button

    // Mark button as active initially
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


// Content text-----------------------------------------------
document.addEventListener("DOMContentLoaded", function() {
    const dataContent = document.getElementById('dataContentText');
    const mediaContent = document.getElementById('mediaContentText');
    const referencesContent = document.getElementById('referencesContentText');

    // Function to update content based on button clicked
    function updatecontentMain(buttonId) {
        // Hide all content divs
        dataContent.style.display = 'none';
        mediaContent.style.display = 'none';
        referencesContent.style.display = 'none';

        // Show relevant content based on button ID
        switch (buttonId) {
            case 'dataButton':
                dataContent.style.display = 'block';

                break;
            case 'mediaButton':
                mediaContent.style.display = 'block';

                break;
            case 'referencesButton':
                referencesContent.style.display = 'block';

                break;
            default:
                dataContent.style.display = 'none';
                mediaContent.style.display = 'none';
                referencesContent.style.display = 'flex';

        }
    }

    // Attach event listeners to buttons
    document.getElementById('dataButton').addEventListener('click', function() {
        updatecontentMain('dataButton');
    });

    document.getElementById('mediaButton').addEventListener('click', function() {
        updatecontentMain('mediaButton');
    });

    document.getElementById('referencesButton').addEventListener('click', function() {
        updatecontentMain('referencesButton');
    });

    // Initialize by showing the About content or any default section
    updatecontentMain('referencesButton');

    // Function to observe display changes using MutationObserver
    function observeDisplayChanges() {
        // Select all the target elements
        const elements = [dataContent, mediaContent, referencesContent];

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


// Fullscreen mode------------------------------------------
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
    const elements = document.querySelectorAll('.scrollable-text-data, .scrollable-text-media, .scrollable-text-references');
    const tenVH = 30; // ticker height

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



