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
document.getElementById('filter-none-title').classList.add('active');






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
    center: [40.7128, -73.8960],
    zoom: 13,
    minZoom: 11,
    maxZoom: 19,
    zoomSnap: 0.5, 
    zoomDelta: 0.5,   
    wheelPxPerZoomLevel: 120,
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
const carbonOpacities = {
    0.25: 0.06, // Smallest size -> lowest opacity
    0.5: 0.12,
    0.75: 0.18,
    1: 0.24,
    1.3: 0.30,
    1.8: 0.40  // Largest size -> highest opacity
};
let geojsonData = null;


// Function to add material markers
const addMaterialMarkers = (geojsonData, material, color, columnName, layerGroup, offset = null, isCarbonView = false) => {
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
            const materialLevel = materialsLvlValue[materialColumns[material]];
            const sizeMultiplier = sizeMultipliers[materialLevel - 1]; // Use the correct digit for each material

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

                // Calculate opacity based on size multiplier if in carbon view
                let opacity;
                if (isCarbonView) {
                    opacity = carbonOpacities[sizeMultiplier];
                } else {
                    opacity = getOpacityForZoom(currentZoom);
                }

                const marker = L.circleMarker([lat, lng], {
                    radius: Math.max(baseRadius * sizeMultiplier, minRadius),
                    color: color,
                    fillColor: color,
                    weight: 0,
                    fillOpacity: opacity,
                    opacity: 1,
                    className: `leaflet-circle-${material}`,
                    interactive: false
                });

                markers.push({ 
                    marker, 
                    sizeMultiplier,
                    materialLevel, // Store the material level for opacity calculations
                    featureId: feature.id || index, // Store feature ID or index for future reference
                    isCarbonView  // Store whether this marker was created in carbon view
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
        if (zoom <= 11) return 0.95 * Math.pow(2, zoom - 11);
        if (zoom <= 12) return 0.65 * Math.pow(2, zoom - 11);
        return 0.4 * Math.pow(2, zoom - 11); // Scales exponentially with zoom
    }

    function getOpacityForZoom(zoom) {
        if (zoom <= 11) return 0.15;
        if (zoom <= 12) return 0.45;
        return 0.55;
    }

    mainMap.on('zoomend', function() {
        const currentZoom = mainMap.getZoom();
        const baseRadius = getBaseRadiusForZoom(currentZoom);
        const minRadius = 1;

        markers.forEach(item => {
            const newRadius = Math.max(baseRadius * item.sizeMultiplier, minRadius);
            item.marker.setRadius(newRadius);
            
            // Calculate opacity based on the size if in carbon view
            let opacity;
            if (item.isCarbonView) {
                opacity = carbonOpacities[item.sizeMultiplier];
            } else {
                opacity = getOpacityForZoom(currentZoom);
            }
            
            item.marker.setStyle({ fillOpacity: opacity });
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
    const defaultBtn = document.getElementById('filter-none-title');
    const allButtons = [
        'mainMap-2a',
        'mainMap-2b',
        'mainMap-1940a',
        'mainMap-1940b',
        'mainMap-carbon',
        'mainMap-carbon-pp',
    ];

    for (const btnId of allButtons) {
        if (document.getElementById(btnId).classList.contains('active')) {
            defaultBtn.classList.remove('active'); // Remove active from 'ALL'
            switch (btnId) {
                case 'mainMap-2a': return 'materials<=2-lvl';
                case 'mainMap-2b': return 'materials>2-lvl';
                case 'mainMap-1940a': return 'materials<=1940-lvl';
                case 'mainMap-1940b': return 'materials>1940-lvl';
                case 'mainMap-carbon': return 'materials-carbon-lvl';
                case 'mainMap-carbon-pp': return 'materials-carbon-pp-lvl';
            }
        }
    }

    // If no other active button, fallback to 'ALL'
    if (defaultBtn.classList.contains('active')) {
        return 'materials-lvl';
    }

    return null;
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
    
    // Check if carbon view is active
    const isCarbonView =
    document.getElementById('mainMap-carbon').classList.contains('active') ||
    document.getElementById('mainMap-carbon-pp').classList.contains('active');
      
    // If we already have markers loaded, we'll update them rather than reload everything
    if (markerReferences.steel) {
        updateExistingMarkers(newMaterialColumn, isCarbonView);
        return;
    }
    
    // Initial load of GeoJSON data
    fetch('data/centroid_data_100m_material_20250419.geojson.gz')
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
                // Use black for all materials if carbon view is active
                const color = isCarbonView ? '#000000' : materialColors[material];
                
                markerReferences[material] = addMaterialMarkers(
                    geojsonData,
                    material,
                    color,
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
                    materialOffsets[material],
                    isCarbonView // Pass the carbon view flag
                );
            });
        })
        .catch(error => {
            console.error('Error loading and decompressing centroid GeoJSON:', error);
        });
}

// Function to update existing markers with new size values
function updateExistingMarkers(newColumnName, isCarbonView = false) {
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
        
        // Update color for all markers based on carbon view
        const color = isCarbonView ? '#000000' : materialColors[material];
        
        // Update each marker
        markers.forEach(item => {
            const feature = featureMap[item.featureId];
            if (!feature) return;
            
            // Get the new size multiplier based on the new column
            const materialsLvlValue = feature.properties[newColumnName]?.toString() || "0";
            const materialLevel = materialsLvlValue[materialColumns[material]];
            const newSizeMultiplier = materialLevel > 0 ? 
                sizeMultipliers[materialLevel - 1] : 0;
            
            const currentRadius = item.marker._radius || item.marker.getRadius();
            const targetRadius = Math.max(baseRadius * newSizeMultiplier, minRadius);
            
            // Set opacity based on size if in carbon view
            let targetOpacity;
            if (isCarbonView && newSizeMultiplier > 0) {
                targetOpacity = carbonOpacities[newSizeMultiplier]; 
            } else {
                targetOpacity = getOpacityForZoom(currentZoom);
            }
            
            // Update color for carbon view
            item.marker.setStyle({ 
                color: color,
                fillColor: color
            });
            
            // Store the carbon view state and new material level
            item.isCarbonView = isCarbonView;
            item.materialLevel = materialLevel;
            
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
                animateMarkerOpacity(item.marker, 0, targetOpacity, 300);
                animateMarkerTransition(item.marker, 0, targetRadius);
            } 
            // Otherwise just animate the size change and update opacity
            else {
                if (currentRadius !== targetRadius) {
                    animateMarkerTransition(item.marker, currentRadius, targetRadius);
                }
                
                // If opacity needs to change (e.g., switching to/from carbon view or size changed)
                if (item.marker.options.fillOpacity !== targetOpacity) {
                    animateMarkerOpacity(item.marker, item.marker.options.fillOpacity, targetOpacity, 300);
                }
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

// Set up event listeners on all relevant buttons including 'filter-none-title'
document.querySelectorAll('.mainMap-layers-button, #filter-none-title').forEach(button => {
    button.addEventListener('click', function () {
        // Remove 'active' from all buttons
        document.querySelectorAll('.mainMap-layers-button, #filter-none-title').forEach(btn => btn.classList.remove('active'));
        
        // Add 'active' to the clicked one
        button.classList.add('active');

        // Refresh markers
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
function togglePanel(panelToggleId, panelContentId, panelTitleId, panelId) {
    const panelTitle = document.getElementById(panelTitleId);
    const panelContent = document.getElementById(panelContentId);
    const panelToggle = document.getElementById(panelToggleId);
    const panel = panelId ? document.getElementById(panelId) : null;

    panelTitle.addEventListener("click", function () {
        if (panelContent.classList.contains("expanded")) {
            panelContent.style.maxHeight = "0px";
            setTimeout(() => panelContent.classList.remove("expanded"), 300); // Delay removing class after transition
            
            // Remove class from the panel if it exists and is the building panel
            if (panel && panelId === "panelBuilding") {
                panel.classList.remove("expanded");
            }
        } else {
            panelContent.classList.add("expanded");
            let extraHeight = 0;
            if (panelContentId === "panelContentMaterial") {
                extraHeight = 15;
            }
            panelContent.style.maxHeight = (panelContent.scrollHeight + extraHeight) + "px";

            
            // Add class to the panel with a 0.5s delay if it exists and is the building panel
            if (panel && panelId === "panelBuilding") {
                setTimeout(() => {
                    panel.classList.add("expanded");
                }, 500); // 500ms delay for adding the expanded class
            }
        }

        panelToggle.classList.toggle("rotated");
        this.classList.toggle("expanded");
    });

    // Auto-expand on load
    panelContent.classList.add("expanded");
    let autoExtraHeight = 0;
    if (panelContentId === "panelContentMaterial") {
            autoExtraHeight = 15;
        }
    panelContent.style.maxHeight = (panelContent.scrollHeight + autoExtraHeight) + "px";
    panelToggle.classList.add("rotated");
    panelTitle.classList.add("expanded");
    
    // Add class to the panel on auto-expand with delay if it exists and is the building panel
    if (panel && panelId === "panelBuilding") {
        setTimeout(() => {
            panel.classList.add("expanded");
        }, 100); // 500ms delay for adding the expanded class on load
    }
}

// Apply the toggle logic for each panel and auto-expand
document.addEventListener("DOMContentLoaded", function () {
    togglePanel("panelToggleBuilding", "panelContentBuilding", "panelTitleBuilding", "panelBuilding");
    togglePanel("panelToggleFilter", "panelContentFilter", "panelTitleFilter");
    togglePanel("panelToggleMaterial", "panelContentMaterial", "panelTitleMaterial");
    togglePanel("panelToggleInfo", "panelContentInfo", "panelTitleInfo");
});




// Tooltip: Material panel
const guideIcon = document.getElementById("guide-icon-material");

guideIcon.addEventListener("mouseenter", () => {
    const tooltip = getCurrentTooltip();
    tooltip.style.display = "block";
});

guideIcon.addEventListener("mousemove", (e) => {
    const tooltip = getCurrentTooltip();
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    tooltip.style.left = `${e.clientX - tooltipWidth}px`;
    tooltip.style.top = `${e.clientY - tooltipHeight}px`;
});

guideIcon.addEventListener("mouseleave", () => {
    const tooltip = getCurrentTooltip();
    tooltip.style.display = "none";
});

function getCurrentTooltip() {
    const isCarbon = document.getElementById("mainMap-carbon")?.classList.contains("active");
    const isCarbonPP = document.getElementById("mainMap-carbon-pp")?.classList.contains("active");
    return (isCarbon || isCarbonPP)
        ? document.getElementById("tooltip-carbon")
        : document.getElementById("tooltip");
}


// Tooltip: Filter panel
const guideIconFilter = document.getElementById("guide-icon-filter");

guideIconFilter.addEventListener("mouseenter", () => {
    const tooltip = getFilterTooltip();
    tooltip.style.display = "block";
});

guideIconFilter.addEventListener("mousemove", (e) => {
    const tooltip = getFilterTooltip();
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    tooltip.style.left = `${e.clientX - tooltipWidth}px`;
    tooltip.style.top = `${e.clientY - tooltipHeight}px`;
});

guideIconFilter.addEventListener("mouseleave", () => {
    const tooltip = getFilterTooltip();
    tooltip.style.display = "none";
});

function getFilterTooltip() {
    return document.getElementById("tooltip-chart");
}


// ----------------------------------------------------------------------

// X-ray mask div---------------------------------------------
// Create custom pane for xray layers first (add this at the beginning of your script)
mainMap.createPane('xrayPane');
mainMap.getPane('xrayPane').style.zIndex = 400; // Above base map, below controls
mainMap.getPane('xrayPane').style.pointerEvents = 'none'; 

// Prevent interaction with xray layers by default
let xrayLegend = document.getElementById("xray-legend");
let xrayRoadsLegend = document.getElementById("xray-roads-legend");


const ShiftedTileLayer = L.TileLayer.extend({
    initialize: function(url, options) {
        this._xShift = options.xShift || 0; // in tile fractions
        this._yShift = options.yShift || 0;
        L.TileLayer.prototype.initialize.call(this, url, options);
    },

    _setZoomTransform: function(level, center, zoom) {
        // Call the default behavior
        L.TileLayer.prototype._setZoomTransform.call(this, level, center, zoom);

        // Now apply shift based on zoom level
        const tileSize = this.getTileSize();
        const xOffset = this._xShift * tileSize.x;
        const yOffset = this._yShift * tileSize.y;

        // Apply CSS transform to tile container
        level.el.style.transform += ` translate(${xOffset}px, ${yOffset}px)`;
    }
});


const xraySatelliteLayer = new ShiftedTileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
    {
        attribution: 'Tiles &copy; Esri',
        pane: 'xrayPane',
        xShift: 0,
        yShift: 0.1 // move tiles slightly downward
    }
);

const xrayEsriLayer = new ShiftedTileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', 
    {
        attribution: 'Tiles &copy; Esri',
        pane: 'xrayPane',
        xShift: 0,
        yShift: 0.05
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
let xraySubwayLayer;

fetch('data/transportation_subway_combined.geojson')
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

        // First, sort the features so points come after lines
        // This helps with initial rendering order
        data.features.sort((a, b) => {
            if (a.geometry.type === "Point" && 
               (b.geometry.type === "LineString" || b.geometry.type === "MultiLineString")) {
                return 1; // Points come after lines
            }
            if ((a.geometry.type === "LineString" || a.geometry.type === "MultiLineString") && 
                b.geometry.type === "Point") {
                return -1; // Lines come before points
            }
            return 0;
        });
        
        xraySubwayLayer = L.geoJSON(data, {
            pane: 'xrayPane',
            style: (feature) => {
                // Check if the feature is a LineString (route)
                if (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") {
                    const lineSymbol = feature.properties.rt_symbol;
                    const color = subwayColors[lineSymbol] || "#000000";
                    return {
                        weight: 3,
                        color: color,
                        opacity: 1,
                        fillOpacity: 0,
                        interactive: false
                    };
                }
            },
            pointToLayer: (feature, latlng) => {
                // Check if the feature is a Point (station)
                if (feature.geometry.type === "Point") {
                    return L.circleMarker(latlng, {
                        radius: 5,
                        fillColor: "#FFFFFF",
                        color: "#000000",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 1,
                        interactive: false,
                        className: 'subway-station-marker'
                    });
                }
                return null;
            },
            onEachFeature: (feature, layer) => {
                // If this is a point feature (station), bring it to front and set higher z-index
                if (feature.geometry.type === "Point") {
                    // Use event to ensure this happens after rendering
                    layer.on('add', function() {
                        this.bringToFront();
                        
                        // Access the SVG element and set z-index
                        if (this._path) {
                            this._path.setAttribute('style', this._path.getAttribute('style') + '; z-index: 1000;');
                        }
                    });
                }
            }
        });
        ;
        document.head.appendChild(style);
    })
    .catch(error => console.error('Error loading combined subway data:', error));


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
                                    color: white;
                                    background-color: black;
                                    border-radius: 10px;
                                    padding-left: 9px;
                                    padding-right: 9px;
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
mainMap.createPane('xrayRoadsPane');
mainMap.getPane('xrayRoadsPane').style.zIndex = 402;

// Create a flag to track if we're hovering over roads
let isHoveringRoads = false;

fetch('data/transportation_roads.geojson')
    .then(response => response.json())
    .then(data => {
        const visibleLayer = L.geoJSON(data, {
            pane: 'xrayPane',
            style: (feature) => {
                const type = feature.properties.Route_Type;
                const status = feature.properties.Route_Status;
                return {
                    color: 'black',
                    weight: type === 1 ? '4' : '2',
                    dashArray: status === 1 ? null : '1,5',
                    opacity: 1
                };
            }
        });

        const bufferLayer = L.geoJSON(data, {
            pane: 'xrayRoadsPane',
            style: {
                color: '#000000',
                weight: 15,
                opacity: 0
            },
            onEachFeature: (feature, layer) => {
                const name = feature.properties.Route_Name || 'Unnamed Route';
                // const legendGuide = document.getElementById('xray-roads-legend-guide');
            
                layer.on('mouseover', function (e) {
                    isHoveringRoads = true;
                    if (legendGuide) {
                        legendGuide.innerHTML = `<strong>${name}</strong>`;
                    }
                });
                
                layer.on('mouseout', function (e) {
                    // Only change state if we're not moving to another road feature
                    if (!e.relatedTarget || !bufferLayer.hasLayer(e.relatedTarget)) {
                        isHoveringRoads = false;
                    }
                    
                    if (legendGuide) {
                        legendGuide.innerHTML = '';
                    }
                });
            },
            filter: (feature) => true,
            coordsToLatLng: function (coords) {
                return L.latLng(coords[1] - 0.00120, coords[0]);
            }
        });
        
        xrayRoadsLayer = L.layerGroup([visibleLayer, bufferLayer]);
        
        // Add a mouseout handler for the whole map
        mainMap.on('mousemove', function(e) {
            // If we're in road hovering mode but cursor is not actually over a road feature
            // This helps handle edge cases where mouseout doesn't fire properly
            // if (isHoveringRoads && !isMouseOverRoad(e, bufferLayer)) {
            //     isHoveringRoads = false;
            //     const legendGuide = document.getElementById('xray-roads-legend-guide');
            //     if (legendGuide) {
            //         legendGuide.innerHTML = '';
            //     }
            // }
            
            // Set pointer-events based on whether we're hovering roads
            mainMap.getPane('xrayRoadsPane').style.pointerEvents = isHoveringRoads ? 'auto' : 'none';
        });
    })
    .catch(error => console.error('Error loading roads data:', error));

// Helper function to check if mouse is over a road feature
function isMouseOverRoad(mouseEvent, roadLayer) {
    let isOver = false;
    const point = mouseEvent.layerPoint;
    
    roadLayer.eachLayer(function(layer) {
        if (layer.getElement && layer.getElement()) {
            const bounds = layer.getBounds();
            if (bounds.contains(mouseEvent.latlng)) {
                isOver = true;
            }
        }
    });
    
    return isOver;
}

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
                    // color: routeColor,
                    color: 'black',
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
        const revealSize = 300;
        const cornerRadius = 150;

        // Get all relevant panes
        const xrayPane = mainMap.getPane('xrayPane');
        const xrayLabelsPane = mainMap.getPane('xrayLabelsPane');
        const xrayRoadsPane = mainMap.getPane('xrayRoadsPane');
        
        // Convert page coordinates to map container coordinates
        const mapContainer = mainMap.getContainer();
        const rect = mapContainer.getBoundingClientRect();
        const containerPoint = L.point(
            mouseX - rect.left - window.pageXOffset,
            mouseY - rect.top - window.pageYOffset
        );

        // Move the visible mask element with the cursor
        xrayMaskElement.style.left = `${mouseX - revealSize / 2}px`;
        xrayMaskElement.style.top = `${mouseY - revealSize / 2}px`;
        xrayMaskElement.style.display = 'block';

        // Convert container coordinates to map layer point
        const layerPoint = mainMap.containerPointToLayerPoint(containerPoint);
        
        // Create the clip-path value
        const clipPathValue = `inset(
            calc(${layerPoint.y}px - ${revealSize / 2}px) 
            calc(100% - ${layerPoint.x}px - ${revealSize / 2}px) 
            calc(100% - ${layerPoint.y}px - ${revealSize / 2}px) 
            calc(${layerPoint.x}px - ${revealSize / 2}px)
            round ${cornerRadius}px
        )`;
        
        // Apply clip-path to all relevant panes
        [xrayPane, xrayLabelsPane].forEach(pane => {
            if (pane) {
                pane.style.clipPath = clipPathValue;
                pane.style.webkitClipPath = clipPathValue;
                
                // Also apply the clip path to all SVG and shape elements within the pane
                const clipTargets = pane.querySelectorAll('svg, g, path, circle, rect, line, polyline, polygon');
                clipTargets.forEach(el => {
                    el.style.clipPath = clipPathValue;
                    el.style.webkitClipPath = clipPathValue;
                });
            }
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
    document.querySelectorAll(".custom-dropdown").forEach(dropdown => {
        if (dropdown !== except) {
            let selectedText = dropdown.querySelector(".dropdown-selected");
            const defaultText = selectedText.dataset.default || "";
            
            // Preserve only the note div if it exists
            const noteDiv = selectedText.querySelector(".dropdown-selected-note");
            let savedNoteDiv = null;
            if (noteDiv) {
                savedNoteDiv = noteDiv.cloneNode(true);
            }
            
            // Reset the element to just contain the default text
            selectedText.textContent = defaultText;
            
            // Re-add the note div if it existed
            if (savedNoteDiv) {
                selectedText.appendChild(savedNoteDiv);
            }
            
            selectedText.style.color = "grey";
            let layerIcon = dropdown.querySelector(".layer-icon");
            if (layerIcon) {
                layerIcon.classList.remove("active");
            }
            dropdown.dataset.value = "";
        }
    });

    // Reset "none" buttons
    noneButtons.forEach((button) => {
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
    const horizontalBuffer = 750; 

    // Remove previous directional classes
    tooltipEl.classList.remove("tooltip-top", "tooltip-right");

    if (projected.y < verticalBuffer) {
        tooltipEl.classList.add("tooltip-top");
    }

    if ((mapContainer.width - projected.x) < horizontalBuffer) {
        tooltipEl.classList.add("tooltip-right");
    }
}




// Markers-------------------------------------------------------
const xrayMarkers = [];

fetch('data/marker-data-20250421.csv')
    .then(response => response.text())
    .then(csvText => {
        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        });

        parsed.data.forEach(row => {
            const lat = parseFloat(row.MarkerLat);
            const lng = parseFloat(row.MarkerLon);

            if (isNaN(lat) || isNaN(lng)) {
                console.warn('Invalid lat/lng:', row.MarkerLat, row.MarkerLon);
                return;
            }

            const markerName = row.MarkerQuote || '';
            const markerNameLink = row.MarkerQuoteLink || '';
            const markerTitle = row.MarkerTitle || '';
            const markerStory = row.MarkerStory || '';
            const markerRefName = row.MarkerRefName || '';
            const markerRefLink = row.MarkerRefLink || '';
            const markerRefYear = row.MarkerRefYear || '';
            const markerImage = row.MarkerImage || '';
            const markerImageSource = row.MarkerAttribution || '';
            let shapeGeoJson = null;
            if (row.MarkerShape && (row.MarkerShape.trim().startsWith("{") || row.MarkerShape.trim().startsWith("["))) {
                try {
                    shapeGeoJson = JSON.parse(row.MarkerShape);
                } catch (e) {
                    console.warn("Invalid JSON in MarkerShape:", row.MarkerShape);
                }
            }

            const markerHtml = `
                <div class="xray-marker" id="marker-${markerName.replace(/\s+/g, '-').toLowerCase()}">
                    <div class="xray-marker-label">${markerName}</div>
                    <div class="xray-marker-icon"></div>
                    <div class="xray-marker-info">
                    <div class="marker-image-source">${markerImageSource}</div>
                        <div class="marker-image">
                            <img src="${markerImage}" alt="${markerName}">
                        </div>
                        
                        <div class="marker-text-content">
                            <div class="marker-header">
                                <div class="marker-name">
                                ${markerTitle}
                                </div>
                                <div class="marker-quote-ref">
                                    <a href="${markerNameLink}" target="_blank">
                                        QUOTE ORIGIN
                                    </a>
                                </div>
                            </div>
                            <div class="marker-story">${markerStory}</div>
                            <div class="marker-references">
                                See: <a href="${markerRefLink}" target="_blank">${markerRefName} (${markerRefYear})</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;


            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: "custom-xray-marker",
                    html: markerHtml,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    zIndexOffset: 1001
                }),
                interactive: true,
                pane: 'markerPane'
            });

            let shapeLayer;
            if (shapeGeoJson) {
                shapeLayer = L.geoJSON(shapeGeoJson, {
                    style: function (feature) {
                        const isMultiLine = feature.geometry && feature.geometry.type === "MultiLineString";
                        return {
                            color: 'transparent',
                            fillOpacity: 0,
                            weight: isMultiLine ? 0 : 0,  // default weight on init
                            zIndexOffset: -1
                        };
                    },
                    pane: 'markerPane'
                }).addTo(markerMap);
            }

            marker.on("mouseover", function () {
                if (shapeLayer) {
                    shapeLayer.setStyle(function (feature) {
                        const isMultiLine = feature.geometry && feature.geometry.type === "MultiLineString";
                        return {
                            color: 'black',
                            fillOpacity: 0.25,
                            weight: isMultiLine ? 3 : 0
                        };
                    });
                }

                marker.getElement().style.zIndex = '10000';

                const tooltipEl = marker.getElement()?.querySelector(".xray-marker-info");
                if (tooltipEl) {
                    updateTooltipDirection(marker, tooltipEl);
                }
            });

            marker.on("mouseout", function () {
                if (shapeLayer) {
                    shapeLayer.setStyle({
                        color: 'transparent',
                        weight: 0,
                        fillOpacity: 0,
                    });
                }
                marker.getElement().style.zIndex = '';
            });


            markerMap.addLayer(marker);
            xrayMarkers.push(marker);
            
            const labelEl = marker.getElement()?.querySelector(".xray-marker-label");
            if (labelEl) {
                labelEl.addEventListener("mouseenter", () => {
                    labelEl.classList.add("visited");
                });
            }
        });
    })
    .catch(error => console.error('Error loading CSV:', error));


// Ensure markerMap pane is rendered above others
markerMap.getPane = function () {
    let pane = mainMap.getPane('markerPane');
    if (!pane) {
        pane = mainMap.createPane('markerPane');
        pane.style.zIndex = '9999';
    }
    return pane;
};

mainMap.addLayer(markerMap);



// Marker toggle
let markersVisible = true;

document.getElementById("xray-marker-toggle").addEventListener("click", () => {
    markersVisible = !markersVisible;

    xrayMarkers.forEach(marker => {
        if (markersVisible) {
            markerMap.addLayer(marker);
        } else {
            markerMap.removeLayer(marker);
        }
    });

    const toggleEl = document.getElementById("xray-marker-toggle");
    const iconEl = toggleEl.querySelector("img");
    const textEl = toggleEl.querySelector("span");

    if (markersVisible) {
        iconEl.src = "images/markers_off.svg";
        iconEl.alt = "Markers Off";
        textEl.textContent = "Turn off markers";
    } else {
        iconEl.src = "images/markers_on.svg";
        iconEl.alt = "Markers On";
        textEl.textContent = "Turn on markers";
    }
});






// Mini maps--------------------------------
// Initialize Mini Esri Map
// Custom TileLayer class that allows fractional shifting
const MiniShiftedTileLayer = L.TileLayer.extend({
    initialize: function (url, options) {
        this._xShift = options.xShift || 0; // Fraction of tile
        this._yShift = options.yShift || 0;
        L.TileLayer.prototype.initialize.call(this, url, options);
    },

    _setZoomTransform: function (level, center, zoom) {
        L.TileLayer.prototype._setZoomTransform.call(this, level, center, zoom);

        const tileSize = this.getTileSize();
        const xOffset = this._xShift * tileSize.x;
        const yOffset = this._yShift * tileSize.y;

        // Apply extra transform
        level.el.style.transform += ` translate(${xOffset}px, ${yOffset}px)`;
    }
});

// Initialize Esri Topo Preview
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

new MiniShiftedTileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
        xShift: 0,
        yShift: 0.2 // Adjust this as needed (positive = down, negative = up)
    }
).addTo(esriMap);

// Initialize Mini Satellite Map
let satelliteMap = L.map("satellite-preview", {
    center: mainMap.getCenter(),
    zoom: mainMap.getZoom(),
    zoomSnap: 0,
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

new MiniShiftedTileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        attribution: 'Tiles &copy; Esri',
        xShift: 0,
        yShift: 0.2
    }
).addTo(satelliteMap);

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
// Function to toggle carbon class on material elements
function toggleCarbonClass(isCarbon) {
    // List of all the material types
    const materials = ['wood', 'brick', 'concrete', 'glass', 'steel'];
    
    // For each material, update the corresponding elements
    materials.forEach(material => {
      // Update the radar base element
      const radarBase = document.getElementById(`radar-${material}`);
      if (radarBase) {
        if (isCarbon) {
          radarBase.classList.add('carbon');
        } else {
          radarBase.classList.remove('carbon');
        }
      }
      
      // Update the radar ring element
      const radarRing = document.querySelector(`.radar-ring.${material}`);
      if (radarRing) {
        if (isCarbon) {
          radarRing.classList.add('ring-carbon');
        } else {
          radarRing.classList.remove('ring-carbon');
        }
      }
      
      // Update value display elements if they exist
      const valueDisplay = document.getElementById(`value-${material}`);
      if (valueDisplay) {
        if (isCarbon) {
          valueDisplay.classList.add('carbon');
        } else {
          valueDisplay.classList.remove('carbon');
        }
      }
    });
  }
  
  // Function to check map state and update classes accordingly
  function checkMapStateAndUpdateClasses() {
    const isCarbon =
      document.getElementById('mainMap-carbon')?.classList.contains('active') ||
      document.getElementById('mainMap-carbon-pp')?.classList.contains('active');
    toggleCarbonClass(isCarbon);
  }
  
  
  // Update classes when page loads
  document.addEventListener('DOMContentLoaded', checkMapStateAndUpdateClasses);
  
  // Modified toggle handler to work with carbon classes
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
  
  // Keep your original toggle handlers
  handleToggle('toggle1', 'radar-ring', 'brick', 'radar-brick', 'brick');   
  handleToggle('toggle2', 'radar-ring', 'concrete', 'radar-concrete', 'concrete'); 
  handleToggle('toggle3', 'radar-ring', 'glass', 'radar-glass', 'glass');    
  handleToggle('toggle4', 'radar-ring', 'wood', 'radar-wood', 'wood'); 
  handleToggle('toggle5', 'radar-ring', 'steel', 'radar-steel', 'steel');
  
  // Add listener for map type changes
  function setupMapTypeListeners() {
    const mapButtons = document.querySelectorAll('[id^="mainMap-"]');
    mapButtons.forEach(button => {
      button.addEventListener('click', () => {
        setTimeout(checkMapStateAndUpdateClasses, 50); // small delay
      });
    });
  
    const carbonMapButton = document.getElementById('carbonMapButton');
    if (carbonMapButton) {
      carbonMapButton.addEventListener('click', () => {
        setTimeout(checkMapStateAndUpdateClasses, 50);
      });
    }
  }
  
  
  // Call this after the DOM is loaded
  document.addEventListener('DOMContentLoaded', setupMapTypeListeners);


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
let materialTypes = ["brick", "concrete", "glass", "steel", "wood"]; // Material order of the data

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

fetch('data/tile_data_100m_20250420.geojson.gz')
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
            } else if (document.getElementById('mainMap-carbon')?.classList.contains('active')) {
                return "materials-carbon-lvl";
            } else if (document.getElementById('mainMap-carbon-pp')?.classList.contains('active')) {
                return "materials-carbon-pp-lvl";
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
                
                // console.log(`Active button: ${button.id}, Active column: ${getActiveMaterialsColumn()}`);
                
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
            const handleMouseOver = throttle(function (e, feature) {
                let targetLayer = e.target;

                // Determine mode suffix based on active map
                let suffix = '';
                if (document.getElementById('mainMap-2a')?.classList.contains('active')) {
                    suffix = '<=2';
                } else if (document.getElementById('mainMap-2b')?.classList.contains('active')) {
                    suffix = '>2';
                } else if (document.getElementById('mainMap-1940a')?.classList.contains('active')) {
                    suffix = '<=1940';
                } else if (document.getElementById('mainMap-1940b')?.classList.contains('active')) {
                    suffix = '>1940';
                } else if (document.getElementById('mainMap-carbon')?.classList.contains('active')) {
                    suffix = '-carbon';
                } else if (document.getElementById('mainMap-carbon-pp')?.classList.contains('active')) {
                    suffix = '-carbon-pp';
                }

                // // Determine unit
                // let unit;
                // if (suffix === '-carbon-pp') {
                // unit = 'Unit: kgCO2e/person';
                // } else if (['-carbon', '-carbon-pp'].includes(suffix)) {
                // unit = 'Unit: kgCO2e';
                // } else {
                // unit = 'Unit: Metric ton (~1.1 US ton)';
                // }

                // // Update unit display separately
                // const unitElement = document.getElementById('value-unit');
                // if (unitElement) {
                //     unitElement.textContent = unit;
                // }

                // Get all relevant properties
                const props = feature.properties;

                // Material keys
                const materialKeys = ['steel', 'brick', 'concrete', 'glass', 'wood'];

                // Generate dynamic material values (without unit)
                const materials = {};
                materialKeys.forEach((material) => {
                    const key = suffix ? `${material}${suffix}-txt` : `${material}-txt`;
                    materials[`value-${material}`] = props[key] ?? '';
                });

                // Update material DOM elements
                Object.entries(materials).forEach(([id, value]) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value.toString().trim();
                    } else {
                        console.warn(`Element with ID ${id} not found.`);
                    }
                });

                // Update other fields
                const fields = {
                    "borough": props.Borough,
                    "neighborhood": props.Neighborhood,
                    "population": props.Population,
                    "zonedist": props.ZoneDist,
                    "builtfar": `${props.BuiltFAR_Mean} / ${props.BuiltFAR_Median}`,
                    "numfloors": `${props.NumFloors_Mean} / ${props.NumFloors_Median}`,
                    "yearbuilt": `${props.YearBuilt_Mean} / ${props.YearBuilt_Median}`,
                };

                Object.entries(fields).forEach(([id, value]) => {
                    const el = document.getElementById(id);
                    if (el) el.innerHTML = value;
                });

                // Trigger radar update
                lastFeature = feature;
                cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(() => updateRadarSizes(lastFeature));
            }, 300);


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

// Intro scroll-----------
document.getElementById("button-img-previous").addEventListener("click", () => {
    scrollToImage("previous");
});

document.getElementById("button-img-next").addEventListener("click", () => {
    scrollToImage("next");
});

function scrollToImage(direction) {
    const images = [...document.querySelectorAll(".image-full, .image-narrow")];
    const centerY = window.innerHeight / 2;

    let closestIndex = -1;
    let minDistance = Infinity;

    // Find image closest to center of screen
    images.forEach((img, index) => {
        const rect = img.getBoundingClientRect();
        const imageCenter = rect.top + rect.height / 2;
        const distance = Math.abs(imageCenter - centerY);

        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
        }
    });

    // Calculate target index
    let targetIndex = direction === "next" ? closestIndex + 1 : closestIndex - 1;

    if (targetIndex >= 0 && targetIndex < images.length) {
        images[targetIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    }
}






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
        threshold: 0.1, // Adjust for better sensitivity
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
    let isSidebarExpanded = false; // Sidebar starts collapsed

    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("control-toggle");
    const toggleIcon = document.getElementById("toggleIcon");

    // Ensure sidebar starts collapsed
    toggleIcon.src = "images/panel-collapse.svg"; // Show expand icon

    toggleButton.addEventListener("click", function() {
        if (isSidebarExpanded) {
            sidebar.classList.remove("expanded"); // Collapse
            toggleIcon.src = "images/panel-collapse.svg"; // Change icon to expand
        } else {
            sidebar.classList.add("expanded"); // Expand
            toggleIcon.src = "images/panel-expand.svg"; // Change icon to collapse
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
        panelTitle.innerHTML = 'TILE MATERIALS: METRIC TON';
    } else if (document.getElementById('mainMap-2b')?.classList.contains('active')) {
        panelTitle.innerHTML = 'TILE MATERIALS: METRIC TON';
    } else if (document.getElementById('mainMap-1940a')?.classList.contains('active')) {
        panelTitle.innerHTML = 'TILE MATERIALS: METRIC TON';
    } else if (document.getElementById('mainMap-1940b')?.classList.contains('active')) {
        panelTitle.innerHTML = 'TILE MATERIALS: METRIC TON';
    } else if (document.getElementById('mainMap-carbon')?.classList.contains('active')) {
        panelTitle.innerHTML = 'TILE MATERIALS: KgCO2e';
    } else if (document.getElementById('mainMap-carbon-pp')?.classList.contains('active')) {
        panelTitle.innerHTML = 'TILE MATERIALS: KgCO2e / Person';
    } else {
        panelTitle.innerHTML = 'TILE MATERIALS: Metric Ton'; // Default for 'ALL'
    }
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

