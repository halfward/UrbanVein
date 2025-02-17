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
    position: 'bottomright',
    metric: true,
    imperial: true,
    maxWidth: 120
}).addTo(mainMap);


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

// Function to add material markers to a given layer group (100)
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


// Load GeoJSON data for base 100 layers---------------------------------
d3.json('data/material_centroid_20250217.geojson').then(geojsonData => {
    // Loop through each material type and add markers
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

    // Call the function to check the zoom and toggle layers
    toggleLayersByZoom();

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

// Set up event listeners for toggles
document.getElementById('toggle1').addEventListener('change', function() {
    layerState.brick = this.checked;  // Update state
    console.log('Brick layer state:', layerState.brick);
    updateLayerVisibility();  // Apply new layer state
});
document.getElementById('toggle2').addEventListener('change', function() {
    layerState.concrete = this.checked;  // Update state
    updateLayerVisibility();  // Apply new layer state
});
document.getElementById('toggle3').addEventListener('change', function() {
    layerState.glass = this.checked;  // Update state
    updateLayerVisibility();  // Apply new layer state
});
document.getElementById('toggle4').addEventListener('change', function() {
    layerState.stone = this.checked;  // Update state
    updateLayerVisibility();  // Apply new layer state
});
document.getElementById('toggle5').addEventListener('change', function() {
    layerState.steel = this.checked;  // Update state
    updateLayerVisibility();  // Apply new layer state
});


// On page load, add layers based on initial state
document.addEventListener('DOMContentLoaded', function() {
    updateLayerVisibility();  // Apply the default layer visibility
    toggleLayersByZoom();  // Apply the correct zoom levels
});







// Tooltip streetview API-----------------------------------------------------
var googleApiKey = "AIzaSyBUoZdH38mDXhXTKEpqo6e-tSEfaBqufOQ"; 
mainMap.on('click', function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;

    var streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=300x200&location=${lat},${lng}&fov=90&heading=235&pitch=10&key=${googleApiKey}`;

    var popupContent = `<img src="${streetViewUrl}" alt="Street View"">`;

    L.popup({
        offset: [-150, 0] // Adjusts the popup position
    })
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(mainMap);
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
let xrayMapElement = document.getElementById("xray-map");


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
fetch('data/nyzd.geojson')
    .then(response => response.json())
    .then(data => {
        // Function to determine fill color based on ZONEDIST property
        const getFillColor = (zonedist) => {
            if (zonedist.startsWith('R')) return 'gold';
            if (zonedist.startsWith('C')) return 'tomato';
            if (zonedist.startsWith('M')) return 'violet';
            if (zonedist.startsWith('P')) return 'yellowgreen';
            return 'transparent';
        };

        // Initialize the GeoJSON layer
        xrayZoningLayer = L.geoJSON(data, {
            style: (feature) => {
                const fillColor = getFillColor(feature.properties.ZONEDIST);
                return {
                    weight: 1,                  // Border weight
                    color: fillColor,           // Border color
                    fillColor: fillColor,       // Fill color
                    fillOpacity: 1              // Fill opacity
                };
            }
        });
    })
    .catch(error => console.error('Error loading GeoJSON:', error));


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
                    fillColor: 'transparent' 
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
                            fillOpacity: 1
                        });
                    }
                });
            })
            .catch(error => console.error('Error loading subway stations:', error));
    })
    .catch(error => console.error('Error loading subway lines:', error));




// Define bus routes layer (GeoJSON)
let xrayBusLayer; // Declare globally for toggle functionality

fetch('data/busLines.geojson')
    .then(response => response.json())
    .then(data => {
        // Initialize the GeoJSON layer
        xrayBusLayer = L.geoJSON(data, {
            style: (feature) => {
                const routeColor = feature.properties.color || "#000000"; // Default to black if undefined
                return {
                    weight: 2,               // Line thickness
                    color: routeColor,       // Line color from GeoJSON data
                    opacity: 1,              // Full visibility
                    fillOpacity: 0           // No fill for bus lines
                };
            }
        });
    })
    .catch(error => console.error('Error loading bus GeoJSON:', error));





// X-ray elements
let xrayMask = document.getElementById("xray-mask");
let xrayLegend = document.getElementById("xray-legend");
let xrayControl = document.querySelector(".sml-container");

// Get dropdown elements
let mapDropdown = document.getElementById("map-dropdown");
let planningDropdown = document.getElementById("planning-dropdown");
let transportDropdown = document.getElementById("transport-dropdown");

// Handle cursor movement for X-ray effect
document.addEventListener("mousemove", function (e) {
    if (xrayMask.style.display === "block") { 
        xrayMask.style.left = `${e.pageX}px`; 
        xrayMask.style.top = `${e.pageY}px`;

        // Move the legend along with the cursor when zoning mode is on
        if (xrayLegend.style.display === "block") {
            xrayLegend.style.left = `${e.pageX}px`;  
            xrayLegend.style.top = `${e.pageY - 95}px`; 
        }

        // Adjust X-ray map position dynamically
        xrayMap.setView(mainMap.containerPointToLatLng(mainMap.mouseEventToContainerPoint(e)), mainMap.getZoom());
    }
});

// Function to update X-ray mode based on dropdown selection
function updateXray(mode) {
    if (mode === "none") {
        xrayMask.style.display = "none"; // Hide the mask
        xrayLegend.style.display = "none"; // Hide the legend
        xrayMap.eachLayer(layer => xrayMap.removeLayer(layer)); // Remove all layers
        xrayMapElement.classList.remove("opacity-mask"); // Remove opacity class
        xrayControl.classList.add("opacity-control");
    } else {
        xrayMask.style.display = "block"; // Show the mask
        xrayLegend.style.display = "none"; // Hide the legend initially
        xrayControl.classList.remove("opacity-control");

        xrayMap.eachLayer(layer => xrayMap.removeLayer(layer)); // Clear layers first

        if (mode === "satellite") {
            xraySatelliteLayer.addTo(xrayMap);
            xrayMapElement.classList.remove("opacity-mask");
        } else if (mode === "esri-topo") {
            xrayEsriLayer.addTo(xrayMap);
            xrayMapElement.classList.remove("opacity-mask"); 
        } else if (mode === "subway") {
            xraySubwayLayer.addTo(xrayMap);
            xraySubwayStationsLayer.addTo(xrayMap);
            xrayMapElement.classList.remove("opacity-mask"); 
        } else if (mode === "bus") {
            xrayBusLayer.addTo(xrayMap);
            xrayMapElement.classList.remove("opacity-mask"); 
        } else if (mode === "zoning") {
            if (xrayZoningLayer) {  
                xrayZoningLayer.addTo(xrayMap);
                xrayLegend.style.display = "block";  
                xrayMapElement.classList.add("opacity-mask"); 
            }
        }

        // Force Leaflet to redraw tiles to prevent gray areas
        setTimeout(() => {
            xrayMap.invalidateSize();
        }, 100);
    }
}

// Ensure all dropdown texts are initially grey
document.querySelectorAll(".dropdown-selected").forEach(el => {
    el.style.color = "grey"; // Set default grey color
});

// Set "none" button as active by default
let noneButton = document.querySelectorAll(".label-xray");
noneButton.forEach((button) => {
    button.classList.add("active"); // Add "active" class to each element
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








// X-ray mask sizing-----------------------------------------------------
// Select the size buttons
const smlS = document.getElementById('sml-s');
const smlM = document.getElementById('sml-m');
const smlL = document.getElementById('sml-l');

// Set default size to sml-s
xrayMask.classList.add('sml-s'); // This ensures the mask is small initially
smlS.classList.add('active'); // Ensure sml-s is active initially

// Event listener for sml-m (medium size)
smlM.addEventListener('click', () => {
    xrayMask.classList.remove('sml-s', 'sml-l');
    xrayMask.classList.add('sml-m');
    smlS.classList.remove('active');
    smlM.classList.add('active');
    smlL.classList.remove('active');
});

// Event listener for sml-l (large size)
smlL.addEventListener('click', () => {
    xrayMask.classList.remove('sml-s', 'sml-m');
    xrayMask.classList.add('sml-l');
    smlS.classList.remove('active');
    smlM.classList.remove('active');
    smlL.classList.add('active');
});

// Event listener for sml-s (small size)
smlS.addEventListener('click', () => {
    xrayMask.classList.remove('sml-m', 'sml-l');
    xrayMask.classList.add('sml-s');
    smlS.classList.add('active');
    smlM.classList.remove('active');
    smlL.classList.remove('active');
});




// X-ray dropdown--------------------
document.querySelectorAll('input[name="options"]').forEach(radio => {
    radio.addEventListener('change', function() {
        document.getElementById("transport-dropdown").value = this.value;
    });
});






// Mini maps--------------------------------
// Initialize Mini Esri Map
let esriMap = L.map("esri-preview", {
    center: mainMap.getCenter(),
    zoom: 17,
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
    esriMap.setView(cursorLatLng, 17);
    satelliteMap.setView(cursorLatLng, 17);
});










// Geojson background----------------------------------------------
// Fetch and load the GeoJSON file
fetch('data/NY+NJ_Shoreline.geojson')
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

// Handle toggle1 for brick
document.getElementById('toggle1').addEventListener('change', function() {
    const radarBrick = document.getElementById('radar-brick');
    if (!this.checked) {
        radarBrick.classList.add('inactive');
    } else {
        radarBrick.classList.remove('inactive');
    }
});

// Handle toggle2 for concrete
document.getElementById('toggle2').addEventListener('change', function() {
    const radarConcrete = document.getElementById('radar-concrete');
    if (!this.checked) {
        radarConcrete.classList.add('inactive');
    } else {
        radarConcrete.classList.remove('inactive');
    }
});

// Handle toggle3 for glass
document.getElementById('toggle3').addEventListener('change', function() {
    const radarGlass = document.getElementById('radar-glass');
    if (!this.checked) {
        radarGlass.classList.add('inactive');
    } else {
        radarGlass.classList.remove('inactive');
    }
});

// Handle toggle4 for stone
document.getElementById('toggle4').addEventListener('change', function() {
    const radarStone = document.getElementById('radar-stone');
    if (!this.checked) {
        radarStone.classList.add('inactive');
    } else {
        radarStone.classList.remove('inactive');
    }
});

// Handle toggle5 for steel
document.getElementById('toggle5').addEventListener('change', function() {
    const radarSteel = document.getElementById('radar-steel');
    if (!this.checked) {
        radarSteel.classList.add('inactive');
    } else {
        radarSteel.classList.remove('inactive');
    }
});




// Traffic lights Update, & Tile info update -------------------------------------------
var layer1 = L.geoJSON(null, {
    style: () => ({
        opacity: 0,
        fillOpacity: 0,
        weight: 0,
        dashArray: '0',
        color: 'transparent'
    })
}).addTo(mainMap);

var layer2 = L.geoJSON(null, {
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

fetch('data/tile_data_100m_refined1.geojson')
    .then(response => response.json())
    .then(data1 => fetch('data/tile_data_100m_refined2.geojson')
        .then(response => response.json())
        .then(data2 => {
            let combinedData = [...data1.features, ...data2.features];

            materialTypes.forEach(material => {
                let values = combinedData.map(f => f.properties[material]).filter(v => v !== null && v !== undefined);
                values.sort((a, b) => a - b);
                quantiles[material] = [
                    values[0],
                    getQuantile(values, 0.2),
                    getQuantile(values, 0.4),
                    getQuantile(values, 0.6),
                    getQuantile(values, 0.8),
                    values[values.length - 1]
                ];
            });

            function getQuantile(arr, q) {
                let pos = (arr.length - 1) * q;
                let base = Math.floor(pos);
                let rest = pos - base;
                return arr[base + 1] !== undefined ? arr[base] + rest * (arr[base + 1] - arr[base]) : arr[base];
            }

            function getSizeCategory(value, material) {
                if (value === null || value === 0) return "0%";
            
                let breaks = quantiles[material];
                if (value <= breaks[1]) return "20%";
                if (value <= breaks[2]) return "40%";
                if (value <= breaks[3]) return "60%";
                if (value <= breaks[4]) return "80%";
                return "100%";
            }
            

            function resetRadarSizes() {
                materialTypes.forEach(material => {
                    document.getElementById(`radar-${material}`).style.width = "0%";
                });
            }

            function updateRadarSizes(feature) {
                materialTypes.forEach(material => {
                    let value = feature.properties[material];
                    let size = value !== null && value !== undefined ? getSizeCategory(value, material) : "0%";
                    document.getElementById(`radar-${material}`).style.width = size;
                });
            }

            function formatNumber(num) {
                if (num === null || num === 0) {
                    return "-";
                } else if (num >= 1_000_000_000) {
                    return (num / 1_000_000_000).toFixed(1) + " G";
                } else if (num >= 1_000_000) {
                    return (num / 1_000_000).toFixed(1) + " M";
                } else if (num >= 1_000) {
                    return (num / 1_000).toFixed(1) + " k";
                } else {
                    return num.toFixed(0); // Integer format
                }
            }
            
            function onEachFeatureHandler(feature, layer) {
                layer.on('mouseover', function () {
                    document.getElementById("value-brick").innerHTML = formatNumber(feature.properties.brick) + "t";
                    document.getElementById("value-concrete").innerHTML = formatNumber(feature.properties.concrete) + "t";
                    document.getElementById("value-glass").innerHTML = formatNumber(feature.properties.glass) + "t";
                    document.getElementById("value-stone").innerHTML = formatNumber(feature.properties.stone) + "t";
                    document.getElementById("value-steel").innerHTML = formatNumber(feature.properties.steel) + "t";
                    document.getElementById("borough").innerHTML = feature.properties.Borough;
                    document.getElementById("zonedist").innerHTML = feature.properties.ZoneDist;
                    document.getElementById("builtfar").innerHTML = `${feature.properties.BuiltFAR_Mean} / ${feature.properties.BuiltFAR_Median}`;
                    document.getElementById("numfloors").innerHTML = `${feature.properties.NumFloors_Mean} / ${feature.properties.NumFloors_Median}`;
                    document.getElementById("yearbuilt").innerHTML = `${feature.properties.YearBuilt_Mean} / ${feature.properties.YearBuilt_Median}`;
                    document.getElementById("elev_mean").innerHTML = `${feature.properties.Elev_Mean}ft / ${(feature.properties.Elev_Mean * 0.3048).toFixed(1)}m`;
                    document.getElementById("bedrock_mean").innerHTML = `${feature.properties.Bedrock_Mean}ft / ${(feature.properties.Bedrock_Mean * 0.3048).toFixed(1)}m`;
                    updateRadarSizes(feature);
                });
                layer.on('mouseout', resetRadarSizes);
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

            addGeoJSONLayer(data1, layer1);
            addGeoJSONLayer(data2, layer2);
        })
    );







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
    let isSidebarExpanded = false; // Sidebar starts collapsed

    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("control-toggle");
    const toggleIcon = document.getElementById("toggleIcon");

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


// Nav Button-------------------------------------------------------
// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {
    const buttons = document.querySelectorAll('.nav-button');
    const line = document.createElement('div'); // Create line element
    document.getElementById('sidebar').appendChild(line); // Append to sidebar

    // Position line initially under the explorer button
    const initialButton = document.getElementById('dataButton');
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






// Popup modals--------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Common elements
    const materialPopup = document.getElementById('materialPopup');
    const vizPopup = document.getElementById('visualizationPopup');
    const versionPopup = document.getElementById('versionPopup'); 
    const closePopupButtons = document.querySelectorAll('.popupCloseButton'); 

    // Info icons
    const infoIcon = document.getElementById('materialInfo');
    const vizInfoIcon = document.getElementById('visualizationArchive');
    const versionHistoryLink = document.getElementById('versionHistoryLink');

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

    // Add listeners to all close buttons
    closePopupButtons.forEach(closePopup => {
        closePopup.addEventListener('click', (event) => {
            console.log("Close button clicked");
            event.stopPropagation(); // Prevent the click event from bubbling up

            // Close all popups
            [materialPopup, vizPopup, versionPopup, guidePopup, optionsPopup].forEach(popupElement => {
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
                dataContent.style.display = 'flex';
                mediaContent.style.display = 'none';
                referencesContent.style.display = 'none';

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
    updatecontentMain('dataButton');

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
