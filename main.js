// Get all the buttons
const buttons = document.querySelectorAll('.mainMap-layers-button');

// Function to remove active class from all buttons and add to the clicked one
function setActiveButton(clickedButton) {
    buttons.forEach(button => {
        button.classList.remove('active');  // Remove active class from all
    });
    clickedButton.classList.add('active');  // Add active class to the clicked button
}

// Add event listeners to each button
buttons.forEach(button => {
    button.addEventListener('click', function() {
        setActiveButton(button);  // Set the clicked button as active
    });
});

// Set the "ALL" button as active on page load
document.getElementById('mainMap-all').classList.add('active');






// Initialize the map-------------------------------------------------
let steelLayer = L.featureGroup().setZIndex(4);
let brickLayer = L.featureGroup().setZIndex(2);
let concreteLayer = L.featureGroup().setZIndex(3);
let glassLayer = L.featureGroup().setZIndex(5);
let woodLayer = L.featureGroup().setZIndex(1); 



const nycBounds = L.latLngBounds(
    [40.3774, -74.5591], // SW corner
    [41.0176, -73.4004]  // NE corner
);
const mainMap = L.map('mainMap', {
    center: [40.7128, -73.9460],
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
    zoomLevelOffset: -4  
}).addTo(mainMap);

// Geocoder control
var geocoder = new L.Control.Geocoder({
    defaultMarkGeocode: false
}).on('markgeocode', function(e) {
    mainMap.setView(e.geocode.center, 14); 
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
    steel: '#bf00ff',    // Purple for steel 
    brick: '#ff6000',    // Orange for brick 
    concrete: '#ffff00', // Yellow for concrete
    glass: '#1aff1a',    // Green for glass
    wood: '#3366ff'      // Blue for wood 
};

const materialOffsets = {
    brick: { lat: 0.00031, lng: -0.0004 },     // Upper left
    wood: { lat: 0.00031, lng: 0.0004 },       // Upper right
    concrete: { lat: -0.00031, lng: -0.0004 }, // Lower left
    glass: { lat: -0.00031, lng: 0.0004 }      // Lower right
};

// Mapping materials to column indices in 'materials-lvl'
// THIS IS ALSO THE DEFAULT LAYER ORDER
const materialColumns = {
    steel: 3,  // 4th digit for steel
    brick: 0,  // 1st digit for brick
    concrete: 1,  // 2nd digit for concrete
    glass: 2,  // 3rd digit for glass
    wood: 4   // 5th digit for wood
};

// Layer state to persist visibility
const layerState = {
    steel: true,
    brick: true,
    concrete: true,
    glass: true,
    wood: true
};

// Updated size multipliers mapping directly to the level values (1-6)
const sizeMultipliers = [0.25, 0.5, 0.75, 1, 1.3, 1.8];
let geojsonData = null;

// Function to add material markers
const addMaterialMarkers = (geojsonData, material, color, columnName, layerGroup, offset = null) => {
    const filteredFeatures = geojsonData.features.filter(feature => feature.properties[columnName] > 0);

    let index = 0;
    const batchSize = 500;
    
    const materialLayerGroup = L.layerGroup().addTo(layerGroup);
    const markers = [];

    function processBatch() {
        const batchEnd = Math.min(index + batchSize, filteredFeatures.length);

        for (; index < batchEnd; index++) {
            const feature = filteredFeatures[index];
            const coordinates = feature.geometry.coordinates;
            const materialsLvlValue = feature.properties[columnName].toString(); // Ensure it's a string
            const sizeMultiplier = sizeMultipliers[materialsLvlValue[materialColumns[material]] - 1]; // Use the correct digit for each material

            let lat = coordinates[1];
            let lng = coordinates[0];
            if (offset) {
                lat += offset.lat;
                lng += offset.lng;
            }

            if (materialsLvlValue[materialColumns[material]] > 0) {
                const currentZoom = mainMap.getZoom();
                const baseRadius = getBaseRadiusForZoom(currentZoom);
                const minRadius = 1;

                const marker = L.circleMarker([lat, lng], {
                    radius: Math.max(baseRadius * sizeMultiplier, minRadius),
                    color: color,
                    fillColor: color,
                    weight: 0,
                    fillOpacity: getOpacityForZoom(currentZoom),
                    opacity: 1,
                    className: `leaflet-circle-${material}`,
                    interactive: false
                });

                markers.push({ 
                    marker, 
                    sizeMultiplier,
                    featureId: feature.id || index // Store feature ID or index for future reference
                });

                marker.addTo(materialLayerGroup);
            }
        }

        if (index < filteredFeatures.length) {
            requestAnimationFrame(processBatch);
        } else {
            mainMap.addLayer(materialLayerGroup);
        }
    }

    function getBaseRadiusForZoom(zoom) {
        if (zoom === 11) return 0.95 * Math.pow(2, zoom - 11);
        if (zoom === 12) return 0.65 * Math.pow(2, zoom - 11);
        return 0.4 * Math.pow(2, zoom - 11); // Scales exponentially with zoom
    }

    function getOpacityForZoom(zoom) {
        if (zoom <= 11) return 0.15;
        if (zoom === 12) return 0.45;
        return 0.65;
    }

    mainMap.on('zoomend', function() {
        const currentZoom = mainMap.getZoom();
        const baseRadius = getBaseRadiusForZoom(currentZoom);
        const minRadius = 1;

        markers.forEach(item => {
            const newRadius = Math.max(baseRadius * item.sizeMultiplier, minRadius);
            item.marker.setRadius(newRadius);
            item.marker.setStyle({ fillOpacity: getOpacityForZoom(currentZoom) });
        });
    });

    processBatch();
    
    // Return the marker array and layer group for later reference
    return { markers, materialLayerGroup };
};

// Store marker references for all materials
const markerReferences = {
    steel: null,
    brick: null,
    glass: null,
    concrete: null,
    wood: null
};

// Function to get the appropriate column based on active button
function getActiveMaterialColumn() {
    if (document.getElementById('mainMap-2a').classList.contains('active')) {
        return 'materials<=2-lvl';
    } else if (document.getElementById('mainMap-2b').classList.contains('active')) {
        return 'materials>2-lvl';
    } else if (document.getElementById('mainMap-1940a').classList.contains('active')) {
        return 'materials<=1940-lvl';
    } else if (document.getElementById('mainMap-1940b').classList.contains('active')) {
        return 'materials>1940-lvl';
    } else if (document.getElementById('mainMap-all').classList.contains('active')) {
        return 'materials-lvl';  // Default to 'materials-lvl' when 'ALL' is active
    }
}

// Add this to store animation IDs for each marker
const animationTracker = new Map();

// Updated animation function with better tracking
function animateMarkerTransition(marker, startRadius, endRadius, duration = 400) {
    // Generate a unique ID for this marker
    const markerId = marker._leaflet_id;
    
    // Cancel any existing animation for this marker
    if (animationTracker.has(markerId)) {
        cancelAnimationFrame(animationTracker.get(markerId));
    }
    
    const startTime = performance.now();
    
    function updateRadius(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smoother animation (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        
        const newRadius = startRadius + (endRadius - startRadius) * easeProgress;
        marker.setRadius(newRadius);
        
        if (progress < 1) {
            // Store the animation frame ID for possible cancellation
            const animId = requestAnimationFrame(updateRadius);
            animationTracker.set(markerId, animId);
        } else {
            // Remove from the tracker when animation completes
            animationTracker.delete(markerId);
        }
    }
    
    // Start the animation and store its ID
    const animId = requestAnimationFrame(updateRadius);
    animationTracker.set(markerId, animId);
}

// Function to refresh markers when active button changes
function refreshMarkers() {
    // Get the active column
    const newMaterialColumn = getActiveMaterialColumn();
    
    // If we already have markers loaded, we'll update them rather than reload everything
    if (markerReferences.steel) {
        updateExistingMarkers(newMaterialColumn);
        return;
    }
    
    // Initial load of GeoJSON data
    fetch('data/centroid_data_100m_material_20250323.geojson.gz')
        .then(response => response.arrayBuffer())
        .then(buffer => {
            // Decompress the gzipped file using pako
            const decompressedData = pako.ungzip(new Uint8Array(buffer), { to: 'string' });

            // Parse the decompressed data as JSON
            const geojsonData = JSON.parse(decompressedData);
            
            // Store the geojsonData for later use
            window.materialGeoJsonData = geojsonData;

            // Process the GeoJSON data
            Object.keys(materialColumns).forEach(material => {
                markerReferences[material] = addMaterialMarkers(
                    geojsonData,
                    material,
                    materialColors[material],
                    newMaterialColumn,
                    (() => {
                        switch (material) {
                            case 'steel': return steelLayer;
                            case 'brick': return brickLayer;
                            case 'glass': return glassLayer;
                            case 'concrete': return concreteLayer;
                            case 'wood': return woodLayer;
                        }
                    })(),
                    materialOffsets[material]
                );
            });
        })
        .catch(error => {
            console.error('Error loading and decompressing centroid GeoJSON:', error);
        });
}

// Function to update existing markers with new size values
function updateExistingMarkers(newColumnName) {
    if (!window.materialGeoJsonData) return;
    
    const geojsonData = window.materialGeoJsonData;
    const currentZoom = mainMap.getZoom();
    const baseRadius = getBaseRadiusForZoom(currentZoom);
    const minRadius = 1;
    
    // Process each material type
    Object.keys(materialColumns).forEach(material => {
        if (!markerReferences[material]) return;
        
        const { markers } = markerReferences[material];
        
        // Create a map for quick feature lookup
        const featureMap = {};
        geojsonData.features.forEach((feature, idx) => {
            featureMap[feature.id || idx] = feature;
        });
        
        // Update each marker
        markers.forEach(item => {
            const feature = featureMap[item.featureId];
            if (!feature) return;
            
            // Get the new size multiplier based on the new column
            const materialsLvlValue = feature.properties[newColumnName]?.toString() || "0";
            const newSizeMultiplier = materialsLvlValue[materialColumns[material]] > 0 ? 
                sizeMultipliers[materialsLvlValue[materialColumns[material]] - 1] : 0;
            
            const currentRadius = item.marker._radius || item.marker.getRadius();
            const targetRadius = Math.max(baseRadius * newSizeMultiplier, minRadius);
            
            // If the feature no longer has this material, fade it out
            if (newSizeMultiplier === 0) {
                animateMarkerOpacity(item.marker, item.marker.options.fillOpacity, 0, 300, () => {
                    item.marker.setRadius(0);
                });
            } 
            // If it previously had no material but now does, fade it in
            else if (item.sizeMultiplier === 0 && newSizeMultiplier > 0) {
                item.marker.setRadius(0);
                item.marker.setStyle({ fillOpacity: 0 });
                animateMarkerOpacity(item.marker, 0, getOpacityForZoom(currentZoom), 300);
                animateMarkerTransition(item.marker, 0, targetRadius);
            } 
            // Otherwise just animate the size change
            else if (currentRadius !== targetRadius) {
                animateMarkerTransition(item.marker, currentRadius, targetRadius);
            }
            
            // Update the stored size multiplier
            item.sizeMultiplier = newSizeMultiplier;
        });
    });
}

// Function to animate marker opacity change
function animateMarkerOpacity(marker, startOpacity, endOpacity, duration = 300, callback) {
    const markerId = marker._leaflet_id;
    
    // Cancel any existing animation for this marker
    if (animationTracker.has(markerId + "_opacity")) {
        cancelAnimationFrame(animationTracker.get(markerId + "_opacity"));
    }
    
    const startTime = performance.now();
    
    function updateOpacity(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smoother animation (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        
        const newOpacity = startOpacity + (endOpacity - startOpacity) * easeProgress;
        marker.setStyle({ fillOpacity: newOpacity });
        
        if (progress < 1) {
            // Store the animation frame ID for possible cancellation
            const animId = requestAnimationFrame(updateOpacity);
            animationTracker.set(markerId + "_opacity", animId);
        } else {
            // Remove from the tracker when animation completes
            animationTracker.delete(markerId + "_opacity");
            if (callback) callback();
        }
    }
    
    // Start the animation and store its ID
    const animId = requestAnimationFrame(updateOpacity);
    animationTracker.set(markerId + "_opacity", animId);
}

// Helper function for radius calculation
function getBaseRadiusForZoom(zoom) {
    if (zoom === 11) return 0.95 * Math.pow(2, zoom - 11);
    if (zoom === 12) return 0.65 * Math.pow(2, zoom - 11);
    return 0.4 * Math.pow(2, zoom - 11); // Scales exponentially with zoom
}

// Helper function for opacity calculation
function getOpacityForZoom(zoom) {
    if (zoom <= 11) return 0.15;
    if (zoom === 12) return 0.45;
    return 0.65;
}

// Set up event listeners on the buttons
document.querySelectorAll('.mainMap-layers-button').forEach(button => {
    button.addEventListener('click', function () {
        // Update active class on button click
        document.querySelectorAll('.mainMap-layers-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Refresh markers when the active button changes
        refreshMarkers();
    });
});

// Initial call to refresh markers on page load
refreshMarkers();






// Toggle material on/off states----------------------------------------------
// Update layer visibility based on state
function updateLayerVisibility() {
    // Temporary array to track which layers should be added
    let layersToAdd = [];

    Object.keys(layerState).forEach(material => {
        if (layerState[material]) {
            // Add the layer if it's set to true (but store it for now)
            switch (material) {
                case 'steel':
                    layersToAdd.push(steelLayer);
                    break;
                case 'brick':
                    layersToAdd.push(brickLayer);
                    break;
                case 'glass':
                    layersToAdd.push(glassLayer);
                    break;
                case 'concrete':
                    layersToAdd.push(concreteLayer);
                    break;
                case 'wood':  
                    layersToAdd.push(woodLayer);
                    break;
            }
        } else {
            // Remove the layer immediately if it's set to false
            switch (material) {
                case 'steel':
                    mainMap.removeLayer(steelLayer);
                    break;
                case 'brick':
                    mainMap.removeLayer(brickLayer);
                    break;
                case 'glass':
                    mainMap.removeLayer(glassLayer);
                    break;
                case 'concrete':
                    mainMap.removeLayer(concreteLayer);
                    break;
                case 'wood':
                    mainMap.removeLayer(woodLayer);
                    break;
            }
        }
    });

    // Now, add all layers in the correct order
    layersToAdd.reverse().forEach(layer => {
        layer.addTo(mainMap);
    });

    // Ensure the correct order is maintained
    enforceLayerOrder();
}

function enforceLayerOrder() {
    const layerOrder = [brickLayer, steelLayer, concreteLayer, glassLayer, woodLayer]; // Define correct order
    
    // Remove all layers first
    layerOrder.forEach(layer => {
        if (mainMap.hasLayer(layer)) {
            mainMap.removeLayer(layer);
        }
    });

    // Re-add layers in the correct order
    layerOrder.forEach(layer => {
        if (layerState[getLayerKey(layer)]) {
            layer.addTo(mainMap);
        }
    });
}

// Helper function to map layers back to keys in layerState
function getLayerKey(layer) {
    switch (layer) {
        case steelLayer: return 'steel';
        case brickLayer: return 'brick';
        case glassLayer: return 'glass';
        case concreteLayer: return 'concrete';
        case woodLayer: return 'wood';
        default: return null;
    }
}







// ---------------------------------------------------------------------------



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
    const panelTitle = document.getElementById(panelTitleId);
    const panelContent = document.getElementById(panelContentId);
    const panelToggle = document.getElementById(panelToggleId);

    panelTitle.addEventListener("click", function () {
        if (panelContent.classList.contains("expanded")) {
            panelContent.style.maxHeight = "0px";
            setTimeout(() => panelContent.classList.remove("expanded"), 300); // Delay removing class after transition
        } else {
            panelContent.classList.add("expanded");
            panelContent.style.maxHeight = panelContent.scrollHeight + "px";
        }

        panelToggle.classList.toggle("rotated");
        this.classList.toggle("expanded");
    });

    // Auto-expand on load
    panelContent.classList.add("expanded");
    panelContent.style.maxHeight = panelContent.scrollHeight + "px";
    panelToggle.classList.add("rotated");
    panelTitle.classList.add("expanded");
}

// Apply the toggle logic for each panel and auto-expand
document.addEventListener("DOMContentLoaded", function () {
    togglePanel("panelToggleBuilding", "panelContentBuilding", "panelTitleBuilding");
    togglePanel("panelToggleMaterial", "panelContentMaterial", "panelTitleMaterial");
    togglePanel("panelToggleInfo", "panelContentInfo", "panelTitleInfo");
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



// ----------------------------------------------------------------------

// X-ray mask div-----------------------------------------------------
// Create custom pane for xray layers first (add this at the beginning of your script)
mainMap.createPane('xrayPane');
mainMap.getPane('xrayPane').style.zIndex = 400; // Above base map, below controls
mainMap.getPane('xrayPane').style.pointerEvents = 'none'; // Prevent interaction with xray layers by default
let xrayLegend = document.getElementById("xray-legend");
let xrayRoadsLegend = document.getElementById("xray-roads-legend");


const xraySatelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
    {
        attribution: 'Tiles &copy; Esri',
        pane: 'xrayPane'
    }
);

const xrayEsriLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', 
    {
        attribution: 'Tiles &copy; Esri',
        pane: 'xrayPane'
    }
);
// Define zoning layer (GeoJSON)
let xrayZoningLayer; // Declare globally for toggle functionality

fetch('data/nyzd.geojson.gz')
    .then(response => response.arrayBuffer())
    .then(data => {
        const decompressedData = pako.inflate(data, { to: 'string' });
        const geoJsonData = JSON.parse(decompressedData);
        
        const getFillColor = (zonedist) => {
            if (!zonedist) return 'transparent';
            zonedist = zonedist.trim();
            if (zonedist.startsWith('R')) return 'gold';
            if (zonedist.startsWith('C')) return 'tomato';
            if (zonedist.startsWith('M')) return 'violet';
            if (zonedist.startsWith('P')) return 'yellowgreen';
            return 'transparent';
        };

        xrayZoningLayer = L.geoJSON(geoJsonData, {
            pane: 'xrayPane', // Use the custom pane
            style: (feature) => {
                const fillColor = getFillColor(feature.properties.ZONEDIST);
                return {
                    weight: 1,
                    color: fillColor,
                    fillColor: fillColor,
                    fillOpacity: 0.7,
                    interactive: false 
                };
            }
        });
    })
    .catch(error => console.error('Error loading or decompressing GeoJSON:', error));

// Define subway layers (GeoJSON)
let xraySubwayLayer, xraySubwayStationsLayer;

fetch('data/transportation_subway_routes.geojson')
    .then(response => response.json())
    .then(data => {
        const subwayColors = {
            "1": "#EE352E", "2": "#EE352E", "3": "#EE352E",
            "4": "#00933C", "5": "#00933C", "6": "#00933C",
            "7": "#B933AD",
            "A": "#0039A6", "C": "#0039A6", "E": "#0039A6",
            "B": "#FF6319", "D": "#FF6319", "F": "#FF6319", "M": "#FF6319",
            "G": "#6CBE45",
            "J": "#996633", "Z": "#996633",
            "L": "#A7A9AC",
            "N": "#FCCC0A", "Q": "#FCCC0A", "R": "#FCCC0A",
            "S": "#808183"
        };

        xraySubwayLayer = L.geoJSON(data, {
            pane: 'xrayPane', // Use the custom pane
            style: (feature) => {
                const lineSymbol = feature.properties.rt_symbol;
                const color = subwayColors[lineSymbol] || "#000000";
                return {
                    weight: 3, 
                    color: color, 
                    opacity: 1,         
                    fillOpacity: 0,     
                    fillColor: 'transparent',
                    interactive: false 
                };
            }
        });

        fetch('data/transportation_subway_stops.geojson')
            .then(response => response.json())
            .then(stationData => {
                xraySubwayStationsLayer = L.geoJSON(stationData, {
                    pane: 'xrayPane', // Use the custom pane
                    pointToLayer: (feature, latlng) => {
                        return L.circleMarker(latlng, {
                            radius: 5,
                            fillColor: "#FFFFFF", 
                            color: "#000000", 
                            weight: 2,
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

// Define railway layers (GeoJSON)
let xrayRailwayLayer, xrayRailwayStationsLayer, xrayRailwayStationLabelsLayer;

fetch('data/transportation_railway_routes.geojson')
    .then(response => response.json())
    .then(data => {
        xrayRailwayLayer = L.geoJSON(data, {
            pane: 'xrayPane', // Use the custom pane
            style: (feature) => {
                const color = feature.properties.color || "#000000";
                return {
                    weight: 3,
                    color: color,
                    opacity: 1,
                    fillOpacity: 0,
                    fillColor: 'transparent',
                    interactive: false
                };
            }
        });

        fetch('data/transportation_railway_stops.geojson')
            .then(response => response.json())
            .then(stationData => {
                xrayRailwayStationsLayer = L.geoJSON(stationData, {
                    pane: 'xrayPane', // Use the custom pane
                    pointToLayer: (feature, latlng) => {
                        return L.circleMarker(latlng, {
                            radius: 5,
                            fillColor: "#FFFFFF",
                            color: "#000000",
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 1,
                            interactive: false
                        });
                    }
                });

                // Create a separate pane for labels if needed
                mainMap.createPane('xrayLabelsPane');
                mainMap.getPane('xrayLabelsPane').style.zIndex = 401; // Above xrayPane
                mainMap.getPane('xrayLabelsPane').style.pointerEvents = 'none';

                xrayRailwayStationLabelsLayer = L.layerGroup();
                stationData.features.forEach(feature => {
                    const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
                    const stationName = feature.properties.station;

                    const label = L.marker(latlng, {
                        pane: 'xrayLabelsPane', // Use labels pane
                        icon: L.divIcon({
                            html: `
                                <div style="
                                    font-family: Inter, sans-serif;
                                    font-weight: 500;
                                    font-size: 0.7rem;
                                    color: black;
                                    background-color: rgba(255, 255, 255, 0.9);
                                    border-radius: 10px;
                                    padding-left: 6px;
                                    padding-right: 6px;
                                    white-space: nowrap;
                                    text-align: center;
                                    position: absolute;
                                    left: 50%;
                                    bottom: 100%;
                                    transform: translate(-50%, -8px);
                                ">
                                    ${stationName}
                                </div>
                            `,
                            iconSize: [0, 0],
                            iconAnchor: [0, 0],
                        }),
                        interactive: false
                    });
                    
                    xrayRailwayStationLabelsLayer.addLayer(label);
                });
            })
            .catch(error => console.error('Error loading railway stations:', error));
    })
    .catch(error => console.error('Error loading railway lines:', error));

// Define road layer (GeoJSON)
let xrayRoadsLayer;
let currentRoadPopup = null;

// Create a new pane for interactive road elements
mainMap.createPane('xrayRoadsPane');
mainMap.getPane('xrayRoadsPane').style.zIndex = 402; // Above other xray panes
mainMap.getPane('xrayRoadsPane').style.pointerEvents = 'auto'; // Allow interaction

fetch('data/transportation_roads.geojson')
    .then(response => response.json())
    .then(data => {
        const visibleLayer = L.geoJSON(data, {
            pane: 'xrayPane', // Use xray pane for visible roads
            style: (feature) => {
                const type = feature.properties.Route_Type;
                const status = feature.properties.Route_Status;
                return {
                    color: type === 1 ? '#FF0000' : '#0000FF',
                    weight: 3,
                    dashArray: status === 1 ? null : '4,6',
                    opacity: 1
                };
            }
        });

        const bufferLayer = L.geoJSON(data, {
            pane: 'xrayRoadsPane', // Use interactive pane for the buffers
            style: {
                color: '#000000',
                weight: 15,
                opacity: 0
            },
            onEachFeature: (feature, layer) => {
                const name = feature.properties.Route_Name || 'Unnamed Route';

                layer.on('click', function (e) {
                    // Close existing popup if it exists
                    if (currentRoadPopup && mainMap.hasLayer(currentRoadPopup)) {
                        currentRoadPopup.remove();
                    }

                    currentRoadPopup = L.popup({
                        pane: 'xrayRoadsPane', // Use interactive pane for popups
                        closeButton: false,
                        autoClose: false,
                        closeOnClick: false
                    })
                        .setLatLng(e.latlng)
                        .setContent(`<strong>${name}</strong>`)
                        .openOn(mainMap); // Open on mainMap instead of xrayMap
                });
            }
        });

        xrayRoadsLayer = L.layerGroup([visibleLayer, bufferLayer]);
    })
    .catch(error => console.error('Error loading roads data:', error));

// Define bus routes layer (GeoJSON)
let xrayBusLayer;

fetch('data/transportation_bus_routes.geojson.gz') 
    .then(response => response.arrayBuffer())
    .then(data => {
        const decompressedData = pako.inflate(data, { to: 'string' });
        const geoJsonData = JSON.parse(decompressedData);

        xrayBusLayer = L.geoJSON(geoJsonData, {
            pane: 'xrayPane', // Use the custom pane
            style: (feature) => {
                const routeColor = feature.properties.color || "#000000";
                return {
                    weight: 2,
                    color: routeColor,
                    opacity: 1,
                    fillOpacity: 0,
                    interactive: false 
                };
            }
        });
    })
    .catch(error => console.error('Error loading or decompressing bus GeoJSON:', error));


// 3. Create a mask element to clip the pane
const xrayMaskElement = document.createElement('div');
xrayMaskElement.id = 'xray-mask-element';
document.body.appendChild(xrayMaskElement);

// Set initial style for the mask
xrayMaskElement.style.position = 'absolute';
xrayMaskElement.style.pointerEvents = 'none';
xrayMaskElement.style.display = 'none';
xrayMaskElement.style.zIndex = 401; // Just above the xrayPane

// 4. Updated mouse movement handler for clipping
document.addEventListener("mousemove", function (e) {
    if (xrayMaskElement.style.display === "block") {
        const mouseX = e.pageX;
        const mouseY = e.pageY;
        const revealSize = 350;
        const cornerRadius = 15;
        
        // Get the pane element
        const paneElement = mainMap.getPane('xrayPane');

        // Convert page coordinates to map container coordinates
        const mapContainer = mainMap.getContainer();
        const rect = mapContainer.getBoundingClientRect();
        const containerPoint = L.point(
            mouseX - rect.left - window.pageXOffset,
            mouseY - rect.top - window.pageYOffset
        );

        // Convert container coordinates to map layer point
        const layerPoint = mainMap.containerPointToLayerPoint(containerPoint);
        
        // Apply clip-path to the pane element
        const clipPathValue = `inset(
            calc(${layerPoint.y}px - ${revealSize / 2}px) 
            calc(100% - ${layerPoint.x}px - ${revealSize / 2}px) 
            calc(100% - ${layerPoint.y}px - ${revealSize / 2}px) 
            calc(${layerPoint.x}px - ${revealSize / 2}px)
            round ${cornerRadius}px
        )`;
        
        paneElement.style.clipPath = clipPathValue;
        paneElement.style.webkitClipPath = clipPathValue;
        
        // Also apply the clip path to all SVG and shape elements within the pane
        const clipTargets = paneElement.querySelectorAll('svg, g, path, circle, rect, line, polyline, polygon');
        clipTargets.forEach(el => {
            el.style.clipPath = clipPathValue;
            el.style.webkitClipPath = clipPathValue;
        });

        // Position legend near cursor if visible
        if (xrayLegend.style.display === "block") {
            xrayLegend.style.left = `${mouseX - revealSize / 2}px`;
            xrayLegend.style.top = `${mouseY + revealSize / 2 - 10}px`;
        }
        if (xrayRoadsLegend.style.display === "block") {
            xrayRoadsLegend.style.left = `${mouseX - revealSize / 2}px`;
            xrayRoadsLegend.style.top = `${mouseY + revealSize / 2 - 10}px`;
        }
    }
});

// 5. Updated function to update X-ray mode
function updateXray(mode) {
    const paneElement = mainMap.getPane('xrayPane');
    
    // Helper function to safely check and remove a layer
    function removeLayerIfExists(layer) {
        if (layer && mainMap.hasLayer(layer)) {
            mainMap.removeLayer(layer);
        }
    }
    
    if (mode === "none") {
        xrayMaskElement.style.display = "none";
        xrayRoadsLegend.style.display = "none";
        xrayLegend.style.display = "none";
        
        // Remove all x-ray layers from the map
        removeLayerIfExists(xraySatelliteLayer);
        removeLayerIfExists(xrayEsriLayer);
        removeLayerIfExists(xrayZoningLayer);
        removeLayerIfExists(xraySubwayLayer);
        removeLayerIfExists(xraySubwayStationsLayer);
        removeLayerIfExists(xrayRailwayLayer);
        removeLayerIfExists(xrayRailwayStationsLayer);
        removeLayerIfExists(xrayRailwayStationLabelsLayer);
        removeLayerIfExists(xrayRoadsLayer);
        removeLayerIfExists(xrayBusLayer);
        
        // Hide the pane with clip path
        paneElement.style.clipPath = "inset(100% 100% 100% 100% round 15px)";
        paneElement.style.webkitClipPath = "inset(100% 100% 100% 100% round 15px)";
    } else {
        xrayMaskElement.style.display = "block";
        xrayRoadsLegend.style.display = "none";
        xrayLegend.style.display = "none";
        
        // Remove all x-ray layers first
        removeLayerIfExists(xraySatelliteLayer);
        removeLayerIfExists(xrayEsriLayer);
        removeLayerIfExists(xrayZoningLayer);
        removeLayerIfExists(xraySubwayLayer);
        removeLayerIfExists(xraySubwayStationsLayer);
        removeLayerIfExists(xrayRailwayLayer);
        removeLayerIfExists(xrayRailwayStationsLayer);
        removeLayerIfExists(xrayRailwayStationLabelsLayer);
        removeLayerIfExists(xrayRoadsLayer);
        removeLayerIfExists(xrayBusLayer);
        
        // Add the appropriate layer based on mode
        if (mode === "satellite" && xraySatelliteLayer) {
            xraySatelliteLayer.addTo(mainMap);
        } else if (mode === "esri-topo" && xrayEsriLayer) {
            xrayEsriLayer.addTo(mainMap);
        } else if (mode === "subway") {
            if (xraySubwayLayer) xraySubwayLayer.addTo(mainMap);
            if (xraySubwayStationsLayer) xraySubwayStationsLayer.addTo(mainMap);
        } else if (mode === "railway") {
            if (xrayRailwayLayer) xrayRailwayLayer.addTo(mainMap);
            if (xrayRailwayStationsLayer) xrayRailwayStationsLayer.addTo(mainMap);
            
            // Add label layer only if zoom level is ≤ 13
            if (mainMap.getZoom() > 12 && xrayRailwayStationLabelsLayer) {
                xrayRailwayStationLabelsLayer.addTo(mainMap);
            }
            
            // Listen for zoom changes and show/hide label layer accordingly
            mainMap.on("zoomend", () => {
                const zoom = mainMap.getZoom();
                const hasLabels = mainMap.hasLayer(xrayRailwayStationLabelsLayer);
                if (zoom > 12 && !hasLabels && xrayRailwayStationLabelsLayer) {
                    xrayRailwayStationLabelsLayer.addTo(mainMap);
                } else if (zoom <= 12 && hasLabels) {
                    xrayRailwayStationLabelsLayer.removeFrom(mainMap);
                }
            });
        } else if (mode === "road" && xrayRoadsLayer) {
            xrayRoadsLayer.addTo(mainMap);
            xrayRoadsLegend.style.display = "block";
        } else if (mode === "bus" && xrayBusLayer) {
            xrayBusLayer.addTo(mainMap);
        } else if (mode === "zoning" && xrayZoningLayer) {
            xrayZoningLayer.addTo(mainMap);
            xrayLegend.style.display = "block";
        }
    }
}





// Get dropdown elements
let mapDropdown = document.getElementById("map-dropdown");
let planningDropdown = document.getElementById("planning-dropdown");
let transportDropdown = document.getElementById("transport-dropdown");

// Ensure all dropdown texts are initially grey
document.querySelectorAll(".dropdown-selected").forEach(el => {
    el.style.color = "grey"; // Set default grey color
});

// Define the "none" buttons
let noneButtons = document.querySelectorAll(".label-xray");

// Set "none" button as active by default
noneButtons.forEach((button) => {
    button.classList.add("active"); 
});

// Function to reset all dropdowns
function resetDropdowns(except = null) {
    // Reset all dropdowns except the one currently being interacted with
    document.querySelectorAll(".custom-dropdown").forEach(dropdown => {
        if (dropdown !== except) {
            let selectedText = dropdown.querySelector(".dropdown-selected");
            selectedText.textContent = selectedText.dataset.default; // Reset to category
            selectedText.style.color = "grey"; // Reset to grey

            let layerIcon = dropdown.querySelector(".layer-icon");
            if (layerIcon) {
                layerIcon.classList.remove("active");
            }

            dropdown.dataset.value = "";
        }
    });

    // Always reset "none" buttons, no matter what
    noneButtons.forEach((button) => {
        // If a dropdown is *not* being interacted with, "none" should be active
        if (!except) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}

// Function to reset X-ray and dropdown selections
function resetXray() {
    updateXray("none"); // Turn off X-ray
    resetDropdowns(); // Reset all dropdowns
}

// Add event listener to 'none' buttons
noneButtons.forEach((button) => {
    button.addEventListener("click", function () {
        resetXray();

        // Remove "active" from all buttons first
        noneButtons.forEach((btn) => btn.classList.remove("active"));

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

        updateXray(this.dataset.value); // Trigger X-ray update with the pane-based implementation

        // Remove "none" active state for all noneButtons
        noneButtons.forEach((button) => {
            button.classList.remove("active");
        });
    });
});

// X-ray clear button inverted state
const panelTitle = document.getElementById("panelTitleBuilding");
const clearButton = document.getElementById("xray-none-title");

const observer = new MutationObserver(() => {
    if (!panelTitle.classList.contains("expanded")) {
        clearButton.classList.add("invert-style");
    } else {
        clearButton.classList.remove("invert-style");
    }
});

observer.observe(panelTitle, { attributes: true });

// Set the "ESRI Topographic" option as active by default
document.addEventListener("DOMContentLoaded", () => {
    const esriOption = document.querySelector(".dropdown-option[data-value='esri-topo']");
    if (esriOption) {
        esriOption.click(); // Simulate a click on the ESRI Topographic option
    }
});












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



// ------------------------------------------------------------------------

// Marker layer
// Create a custom pane for the markers to ensure it's above other layers
mainMap.createPane('markerPane');
mainMap.getPane('markerPane').style.zIndex = '1001'; // Higher than other layers

// Create an empty layer group for markers inside the new pane
let markerMap = L.layerGroup([], { pane: 'markerPane' }).addTo(mainMap);


// Updating the tooltip direction based on marker position
function updateTooltipDirection(marker, tooltipEl) {
    const projected = mainMap.latLngToContainerPoint(marker.getLatLng());
    const mapContainer = mainMap.getContainer().getBoundingClientRect();
    const verticalBuffer = 250; 
    const horizontalBuffer = 450; 

    // Remove previous directional classes
    tooltipEl.classList.remove("tooltip-top", "tooltip-right");

    if (projected.y < verticalBuffer) {
        tooltipEl.classList.add("tooltip-top");
    }

    if ((mapContainer.width - projected.x) < horizontalBuffer) {
        tooltipEl.classList.add("tooltip-right");
    }
}





// Load marker GeoJSON data
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
                    brick: '#ff6000',
                    concrete: '#ffff00',
                    glass: '#33ff4e',
                    stone: '#337eff',
                    steel: '#bf00ff'
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
                interactive: true,
                pane: 'markerPane'  
            });

            // Store reference to the GeoJSON shape associated with the marker
            let shapeLayer = L.geoJSON(feature.geometry, {
                style: {
                    color: 'transparent',  // Initially no border color
                    fillOpacity: 0,        // No fill color
                    weight: 2,             // Border width
                    zIndexOffset: 1001
                },
                pane: 'markerPane'  
            }).addTo(markerMap);

            // Hover event to highlight the shape's border on marker hover
            marker.on("mouseover", function () {
                // Highlight the shape's border
                shapeLayer.setStyle({ color: 'black', weight: 2 });
                
                // Raise this marker above others
                marker.getElement().style.zIndex = '10000'; // Higher than the pane's z-index
                
                const markerId = `marker-${properties.Name.replace(/\s+/g, '-').toLowerCase()}`;
                const markerEl = document.getElementById(markerId);
                const tooltipEl = markerEl?.querySelector(".xray-marker-info");
            
                if (tooltipEl) {
                    updateTooltipDirection(marker, tooltipEl);
                }
            });
            
            marker.on("mouseout", function () {
                // Reset the shape's border color
                shapeLayer.setStyle({ color: 'transparent', weight: 2 });
                
                // Reset this marker's z-index to default
                marker.getElement().style.zIndex = ''; // This will revert to the pane's z-index
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



// Traffic lights: Toggle -------------------------------------------
// Function to handle toggle changes for radar rings and radar base
// Function to handle toggling both radar elements and map layers
function handleToggle(toggleId, radarRingClass, radarRingMaterial, radarBaseId, materialKey) {
    document.getElementById(toggleId).addEventListener('change', function () {
        const radarRing = document.querySelector(`.${radarRingClass}.${radarRingMaterial}`);
        const radarBase = document.getElementById(radarBaseId);

        if (radarRing && radarBase) {
            if (!this.checked) {
                radarRing.classList.add('inactive');  
                radarBase.classList.add('inactive');
            } else {
                radarRing.classList.remove('inactive');  
                radarBase.classList.remove('inactive');
            }
        }

        // Update map layer visibility state
        layerState[materialKey] = this.checked;
        updateLayerVisibility(); // Ensure correct visibility and order
    });
}

// Assign handlers for each toggle (radar + map layers)
handleToggle('toggle1', 'radar-ring', 'brick', 'radar-brick', 'brick');   
handleToggle('toggle2', 'radar-ring', 'concrete', 'radar-concrete', 'concrete'); 
handleToggle('toggle3', 'radar-ring', 'glass', 'radar-glass', 'glass');    
handleToggle('toggle4', 'radar-ring', 'wood', 'radar-wood', 'wood'); 
handleToggle('toggle5', 'radar-ring', 'steel', 'radar-steel', 'steel');



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
let materialTypes = ["brick", "concrete", "glass", "steel", "wood"]; // Material order

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

function sanitizeJson(data) {
    return data.replace(/NaN/g, "null");  // Replace NaN with null (or other appropriate value)
}

fetch('data/tile_data_100m_20250408.geojson.gz')
    .then(response => response.arrayBuffer())
    .then(buffer => {
        const decompressed = pako.ungzip(new Uint8Array(buffer), { to: 'string' });
        const sanitized = sanitizeJson(decompressed);  // Sanitize data
        const data = JSON.parse(sanitized);  // Parse the decompressed string as JSON

        // Initialize quantiles based on material types
        materialTypes.forEach((material, index) => {
            let values = data.features.map(f => {
                // Check if materials-lvl exists
                if (f.properties['materials-lvl']) {
                    // Get the materials-lvl array (assuming the first digit is brick, second concrete, etc.)
                    return f.properties['materials-lvl'].split('').map(Number);
                }
                return undefined;  // If materials-lvl is missing, return undefined
            }).filter(v => v !== null && v !== undefined); // Filter out any null/undefined values
        });

        function getSizeCategory(value) {
            if (value === null || value === 0) return "0%";  // Return 0% for null or 0
            if (value === 1) return "16%";  // Return 16% for value 1
            if (value === 2) return "32%";  // Return 32% for value 2
            if (value === 3) return "48%";  // Return 48% for value 3
            if (value === 4) return "64%";  // Return 64% for value 4
            if (value === 5) return "80%";  // Return 80% for value 5
            if (value === 6) return "100%";  // Return 100% for value 6
            return "0%";  // Default case if no match
        }
        // Function to determine the correct materials column based on the active button
        function getActiveMaterialsColumn() {
            if (document.getElementById('mainMap-2a')?.classList.contains('active')) {
                return "materials<=2-lvl";
            } else if (document.getElementById('mainMap-2b')?.classList.contains('active')) {
                return "materials>2-lvl";
            } else if (document.getElementById('mainMap-1940a')?.classList.contains('active')) {
                return "materials<=1940-lvl";
            } else if (document.getElementById('mainMap-1940b')?.classList.contains('active')) {
                return "materials>1940-lvl";
            } else {
                return "materials-lvl"; // Default to "materials-lvl" if no specific filter is active
            }
        }

        // Function to reset all radar sizes
        function resetRadarSizes() {
            materialTypes.forEach(material => {
                document.getElementById(`radar-${material}`).style.width = "0%";
            });
        }

        // Function to update radar sizes based on the selected column
        function updateRadarSizes(feature) {
            let activeColumn = getActiveMaterialsColumn(); // Get the current materials column
            let materialsLvl = feature.properties[activeColumn]?.toString();

            if (materialsLvl && !isNaN(materialsLvl)) {
                materialTypes.forEach((material, index) => {
                    let value = parseInt(materialsLvl.charAt(index), 10);
                    let size = isNaN(value) || value === 0 ? "0%" : getSizeCategory(value);
                    document.getElementById(`radar-${material}`).style.width = size;
                });
            }
        }

        // Add event listeners to update the active button state and refresh data
        document.querySelectorAll('.mainMap-layers-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.mainMap-layers-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                console.log(`Active button: ${button.id}, Active column: ${getActiveMaterialsColumn()}`);
                
                // If lastFeature exists, reapply the radar size update with the new column
                if (lastFeature) {
                    updateRadarSizes(lastFeature);
                }
            });
        });

        

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
                handleMouseOver(e, feature);  // Pass 'feature' here to 'handleMouseOver'
            });
        
            // Throttled function for immediate style update (100ms)
            const handleStyleUpdate = throttle(function (e) {
                let targetLayer = e.target;
                targetLayer.setStyle({
                    color: "black", 
                    weight: 2,
                    opacity: 1
                });
            }, 1000);
        
            // Throttled function for updating values (300ms)
            const handleMouseOver = throttle(function (e, feature) {  // Accept 'feature' as parameter
                let targetLayer = e.target;
                
                // Define the materials and their corresponding IDs
                const materials = {
                    "value-steel": `${feature.properties["steel-txt"]} tonnes`,
                    "value-brick": `${feature.properties["brick-txt"]} tonnes`, 
                    "value-concrete": `${feature.properties["concrete-txt"]} tonnes`,  
                    "value-glass": `${feature.properties["glass-txt"]} tonnes`, 
                    "value-wood": `${feature.properties["wood-txt"]} tonnes`, 
                };
                // Loop through the materials object and update the textContent for each ID
                Object.entries(materials).forEach(([id, value]) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value !== null && value !== undefined ? value : "";  // Ensure no null or undefined values
                    } else {
                        console.warn(`Element with ID ${id} not found.`);
                    }
                });
        
                // Get all relevant properties
                const props = feature.properties;
        
                // Define a mapping of property names to element IDs
                const fields = {
                    "borough": props.Borough,
                    "neighborhood": props.Neighborhood,
                    "population": props.Population,
                    "zonedist": props.ZoneDist,
                    "builtfar": `${props.BuiltFAR_Mean} / ${props.BuiltFAR_Median}`,
                    "numfloors": `${props.NumFloors_Mean} / ${props.NumFloors_Median}`,
                    "yearbuilt": `${props.YearBuilt_Mean} / ${props.YearBuilt_Median}`,
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












// Layer Info Expansion---------------------------------------------------------------
const layerGuideIcon = document.querySelector('.mainMap-guide-icon');
const layersContainer = document.querySelector('#mainMap-layers');

// Toggle the expanded class on click
layerGuideIcon.addEventListener('click', function() {
    layersContainer.classList.toggle('expanded');
});





// Layer Info Charts------------------------------------
const ctx = document.getElementById('numFloorsChart');

// Floor dataset
const floorLabels = ['1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F', '9F', '10F', '11–19F', '20F+'];
const floorOccurrenceData = [13.74, 62.95, 14.25, 3.50, 1.92, 1.85, 0.39, 0.22, 0.13, 0.09, 0.62, 0.34];
const floorStackedData = {
  concrete: [3.48, 19.90, 8.27, 3.12, 2.35, 2.29, 0.53, 0.33, 0.22, 0.19, 1.54, 1.18],
  brick:    [3.53, 19.73, 11.51, 4.52, 3.14, 3.12, 0.46, 0.24, 0.14, 0.10, 0.66, 0.32],
  wood:     [0.54, 3.40, 1.17, 0.36, 0.24, 0.24, 0.04, 0.03, 0.01, 0.01, 0.08, 0.04],
  steel:    [0.15, 0.84, 0.47, 0.22, 0.19, 0.15, 0.04, 0.02, 0.02, 0.02, 0.15, 0.25],
  glass:    [0.04, 0.23, 0.07, 0.02, 0.01, 0.02, 0.00, 0.00, 0.00, 0.00, 0.01, 0.00]
};

// Decade-based dataset
const decadeLabels = [
  '1800s', '1810s', '1820s', '1830s', '1840s', '1850s', '1860s', '1870s', '1880s',
  '1890s', '1900s', '1910s', '1920s', '1930s', '1940s', '1950s', '1960s', '1970s',
  '1980s', '1990s', '2000s', '2010s', '2020s'
];
const decadeOccurrence = [0.01, 0.00, 0.03, 0.05, 0.13, 0.19, 0.17, 0.30, 0.54, 2.98, 4.72, 7.21, 20.74, 16.02, 7.86, 9.88, 8.12, 4.79, 3.97, 3.99, 5.57, 2.14, 0.60];
const decadeStacked = {
  concrete: [0.01, 0.00, 0.04, 0.07, 0.16, 0.21, 0.18, 0.28, 0.52, 1.93, 3.32, 4.39, 8.98, 6.69, 2.30, 2.80, 2.85, 1.64, 1.48, 1.52, 2.44, 1.24, 0.35],
  brick:    [0.01, 0.01, 0.04, 0.08, 0.18, 0.26, 0.22, 0.36, 0.71, 2.62, 4.19, 5.37, 10.03, 8.32, 2.02, 2.45, 2.52, 1.33, 1.13, 1.38, 2.66, 1.22, 0.38],
  wood:     [0.00, 0.00, 0.00, 0.01, 0.02, 0.02, 0.02, 0.03, 0.06, 0.27, 0.42, 0.57, 1.29, 0.97, 0.37, 0.44, 0.42, 0.26, 0.23, 0.24, 0.34, 0.14, 0.04],
  steel:    [0.00, 0.00, 0.00, 0.00, 0.01, 0.01, 0.01, 0.02, 0.03, 0.11, 0.22, 0.29, 0.54, 0.37, 0.09, 0.13, 0.16, 0.09, 0.09, 0.07, 0.14, 0.09, 0.02],
  glass:    [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.02, 0.03, 0.04, 0.09, 0.06, 0.03, 0.03, 0.03, 0.02, 0.02, 0.02, 0.02, 0.01, 0.00]
};

// Function to create datasets based on which view is active
function createDatasets(isDecadeView) {
  const occurrenceData = isDecadeView ? decadeOccurrence : floorOccurrenceData;
  const stackedData = isDecadeView ? decadeStacked : floorStackedData;
  
  return [
    {
      label: 'Building Count',
      data: occurrenceData,
      backgroundColor: '#8f9a9a',
      stack: 'group1',
    },
    {
      label: 'Concrete',
      data: stackedData.concrete,
      backgroundColor: 'rgba(255, 234, 0, 0.65)', // #ffea00
      stack: 'group2',
    },
    {
      label: 'Masonry',
      data: stackedData.brick,
      backgroundColor: 'rgba(255, 96, 0, 0.65)', // #ff6000
      stack: 'group2',
    },
    {
      label: 'Timber',
      data: stackedData.wood,
      backgroundColor: 'rgba(51, 126, 255, 0.65)', // #337eff
      stack: 'group2',
    },
    {
      label: 'Steel',
      data: stackedData.steel,
      backgroundColor: 'rgba(191, 0, 255, 0.65)', // #bf00ff
      stack: 'group2',
    },
    {
      label: 'Glass',
      data: stackedData.glass,
      backgroundColor: 'rgba(51, 255, 78, 0.65)', // #33ff4e
      stack: 'group2',
    },
  ];
}

// Initialize chart with floor dataset
let myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: floorLabels,
    datasets: createDatasets(false)
  },
  options: {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)}%`
        },
        bodyFont: {
          family: 'Inter'
        },
        titleFont: {
          family: 'Inter'
        }
      },
      legend: {
        display: false,
        labels: {
          font: {
            family: 'Inter'
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          font: {
            family: 'Inter'
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Inter'
          },
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  }
});

// Add event listener for toggle
document.addEventListener('DOMContentLoaded', function() {
  const toggleInput = document.querySelector('.mainMap-toggle-input');
  
  if (toggleInput) {
    toggleInput.addEventListener('change', function() {
      const isDecadeView = this.checked;
      
      // Update chart data
      myChart.data.labels = isDecadeView ? decadeLabels : floorLabels;
      myChart.data.datasets = createDatasets(isDecadeView);
      
      // Update chart
      myChart.update();
    });
  }
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
    const tenVH = 60; // ticker height

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




// Change Panel Title based on diff. Layers
function updatePanelTitle() {
    const panelTitle = document.getElementById('panelTitleMaterial-dynamic');

    if (!panelTitle) {
        console.error('panelTitleMaterial-dynamic not found!');
        return;
    }

    if (document.getElementById('mainMap-2a')?.classList.contains('active')) {
        panelTitle.innerHTML = 'TILE COMPOSITION: ≤ 2F';
    } else if (document.getElementById('mainMap-2b')?.classList.contains('active')) {
        panelTitle.innerHTML = 'TILE COMPOSITION: > 2F';
    } else if (document.getElementById('mainMap-1940a')?.classList.contains('active')) {
        panelTitle.innerHTML = 'TILE COMPOSITION: PRE-1940';
    } else if (document.getElementById('mainMap-1940b')?.classList.contains('active')) {
        panelTitle.innerHTML = 'TILE COMPOSITION: POST-1940';
    } else {
        panelTitle.innerHTML = 'TILE COMPOSITION'; // Default for 'ALL'
    }

    console.log('Updated title:', panelTitle.innerHTML);
}

// Attach event listeners to each button
document.querySelectorAll('.mainMap-layers-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.mainMap-layers-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        console.log(`Active button: ${button.id}`);
        updatePanelTitle();
    });
});

// Initial check
updatePanelTitle();

