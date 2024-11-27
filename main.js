// Link controls
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
});



// Guide
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('GuideOverlay');
    const overlayContent = document.getElementById('OverlayContent'); 
    const dontShowAgain = document.getElementById('dontShowAgain');

    // Check localStorage to see if the overlay should be hidden
    if (!localStorage.getItem('hideGuide')) {
        overlay.style.display = 'flex'; // Show the overlay if 'hideGuide' is not set
    }

    // Function to close the Guide overlay
    window.closeGuide = function() {
        overlay.style.display = 'none';
        if (dontShowAgain.checked) {
            localStorage.setItem('hideGuide', 'true'); 
        }
    };

    // Close the overlay when clicking outside of it
    document.addEventListener('click', (event) => {
        // Check if the clicked element is outside the overlayContent and overlay is visible
        if (overlay.style.display === 'flex' && !overlayContent.contains(event.target)) {
            closeGuide();
        }
    });
});






// Initialize the map
const nycBounds = L.latLngBounds(
    [40.4774, -74.2591], // SW corner
    [40.9176, -73.7004]  // NE corner
);
const mainMap = L.map('mainMap', {
    center: [40.7128, -74.0060],
    zoom: 13,
    minZoom: 11,
    maxZoom: 15,
    renderer: L.svg(),
    preferCanvas: true,
    maxBounds: nycBounds,
    maxBoundsViscosity: 1.0
});



const materialColors = {
    steel: '#d100ff',    // Purple for steel 
    brick: '#ff3100',    // Orange for brick 
    concrete: '#d7ff00', // Yellow for concrete 
    glass: '#00ff93',    // Green for glass 
    stone: '#005cff'     // Blue for stone 
};
const materialOffsets = {
    brick: { lat: 0.0003, lng: -0.0004 },     // Upper left
    stone: { lat: 0.0003, lng: 0.0004 },      // Upper right
    concrete: { lat: -0.0003, lng: -0.0004 }, // Lower left
    glass: { lat: -0.0003, lng: 0.0004 }      // Lower right
};

// Create layer groups
let steelLayer, brickLayer, glassLayer, concreteLayer, stoneLayer;

// Add markers for each material with individual blending modes
const addMaterialMarkers = (geojsonData, material, color) => {
    const filteredFeatures = geojsonData.features.filter(feature => feature.properties[material] > 0);
    const binnedDataValues = filteredFeatures.map(feature => feature.properties[material]);
    const quantiles = d3.scaleQuantile()
        .domain(binnedDataValues)
        .range([0, 0.4, 0.8, 1.2, 1.6, 2, 2.4]);

    const materialLayerGroup = L.layerGroup();  // Create layer groups

    filteredFeatures.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        const sizeMultiplier = quantiles(feature.properties[material]);

        let lat = coordinates[1];
        let lng = coordinates[0];
        if (materialOffsets[material]) {
            lat += materialOffsets[material].lat;
            lng += materialOffsets[material].lng;
        }

        if (sizeMultiplier > 0) {
            const baseRadius = 15;
            const minRadius = 5;
            const circle = L.circle([lat, lng], {
                radius: Math.max(baseRadius * sizeMultiplier, minRadius),
                color: color,
                fillColor: color,
                weight: 0,
                fillOpacity: 0.7,
                opacity: 1,
                fillRule: 'evenodd',
                className: `leaflet-circle-${material}`,
            });



            circle.addTo(materialLayerGroup);  // Add the circle to layer groups
        }
    });

    // Store the layer group in the respective variable
    switch (material) {
        case 'steel':
            steelLayer = materialLayerGroup;
            break;
        case 'brick':
            brickLayer = materialLayerGroup;
            break;
        case 'glass':
            glassLayer = materialLayerGroup;
            break;
        case 'concrete':
            concreteLayer = materialLayerGroup;
            break;
        case 'stone':
            stoneLayer = materialLayerGroup;
            break;
    }

    materialLayerGroup.addTo(mainMap);  // Add the layer group to the map
};

// Load GeoJSON data and add markers for each material to the map
d3.json('https://raw.githubusercontent.com/halfward/UrbanVein/main/data/centroid_all.geojson').then(geojsonData => {
    addMaterialMarkers(geojsonData, 'steel', materialColors.steel);
    addMaterialMarkers(geojsonData, 'brick', materialColors.brick);
    addMaterialMarkers(geojsonData, 'glass', materialColors.glass);
    addMaterialMarkers(geojsonData, 'concrete', materialColors.concrete);
    addMaterialMarkers(geojsonData, 'stone', materialColors.stone);
}).catch(error => {
    console.error('Error loading centroid GeoJSON:', error);
});

// Layer toggle function
const toggleLayerVisibility = (layer, buttonId) => {
    const button = document.getElementById(buttonId);
    
    if (mainMap.hasLayer(layer)) {
        mainMap.removeLayer(layer);
        button.classList.remove('on');  // Remove 'on' class to set the button to "off"
        button.classList.add('off');    // Add 'off' class to reflect the "off" state
    } else {
        mainMap.addLayer(layer);
        button.classList.remove('off');  // Remove 'off' class to set the button to "on"
        button.classList.add('on');      // Add 'on' class to reflect the "on" state
    }
};

// Button event listeners
document.getElementById('toggleSteel').addEventListener('click', () => {
    toggleLayerVisibility(steelLayer, 'toggleSteel');
});

document.getElementById('toggleBrick').addEventListener('click', () => {
    toggleLayerVisibility(brickLayer, 'toggleBrick');
});

document.getElementById('toggleGlass').addEventListener('click', () => {
    toggleLayerVisibility(glassLayer, 'toggleGlass');
});

document.getElementById('toggleConcrete').addEventListener('click', () => {
    toggleLayerVisibility(concreteLayer, 'toggleConcrete');
});

document.getElementById('toggleStone').addEventListener('click', () => {
    toggleLayerVisibility(stoneLayer, 'toggleStone');
});







// Geojson background----------------------------------------------
// Fetch and load the GeoJSON file
fetch('https://raw.githubusercontent.com/halfward/UrbanVein/main/data/coastline.geojson')
    .then(response => response.json())
    .then(data => {
        // Check if the #mainMap element has the 'darkmode' class
        const isDarkMode = document.getElementById('mainMap').classList.contains('darkmode');

        // Set the fillColor based on the dark mode class
        const fillColor = isDarkMode ? 'grey' : 'white';

        // Add the GeoJSON layer with style options to make it a background layer
        const coastlineLayer = L.geoJSON(data, {
            style: {
                weight: 0,                // No border
                fillColor: fillColor,     // Dynamically set fillColor
                fillOpacity: .5           // Semi-transparent fill
            }
        }).addTo(mainMap);

        coastlineLayer.bringToBack(); 
    })
    .catch(error => console.error('Error loading GeoJSON:', error));









    let lockedData = null; // Variable to store the fixed values when clicked
    let isHovering = false; // Flag to check if currently hovering over a GeoJSON feature
    
    fetch('https://raw.githubusercontent.com/halfward/UrbanVein/main/data/hex_all.geojson')
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
            geojsonLayer.setZIndex(10);
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
            '#49b1fd',  // Stone
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
                    color: '#bfcdcd', // Grid lines color
                    lineWidth: 1, // Grid line width
                    z: 1,
                    circular: true, // Ensures circular grid
                },
                angleLines: {
                    color: 'rgba(0, 0, 0, 0.2)', // Angle line color
                    lineWidth: 1,
                    z: 1,
                },
                ticks: {
                    callback: function (value) {
                        const romanNumerals = ['NULL', 'I', 'II', 'III', 'IV', 'V'];
                        return romanNumerals[value]; // Converts numeric values to Roman numerals
                    },
                    z: 2,
                    color: '#8f9a9a', 
                    padding: 0,
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)', // Tooltip background color
                titleFont: {
                    family: 'Roboto Condensed, sans-serif',
                    size: 14,
                    weight: 'normal'
                },
                titleColor: 'black',
                bodyFont: {
                    family: 'Roboto Condensed, sans-serif',
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
    Stone: '#49b1fd',
    Steel: '#ec49fd'
};

// Add event listeners to the buttons to toggle the layers' visibility
document.getElementById('toggleBrick').addEventListener('click', () => toggleLayer('Brick'));
document.getElementById('toggleConcrete').addEventListener('click', () => toggleLayer('Concrete'));
document.getElementById('toggleGlass').addEventListener('click', () => toggleLayer('Glass'));
document.getElementById('toggleStone').addEventListener('click', () => toggleLayer('Stone'));
document.getElementById('toggleSteel').addEventListener('click', () => toggleLayer('Steel'));



// Color toggle function----------------------------------------
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






// Rose Chart References
function createDataObject(dataValues) {
    return {
        labels: ['Steel', 'Stone', 'Glass', 'Concrete', 'Brick'],
        datasets: [{
            label: 'density level',
            data: dataValues,
            backgroundColor: [
                '#ec49fd',  // Steel
                '#49b1fd',  // Stone
                '#49fcd7',  // Glass
                '#ddfa47',  // Concrete
                '#ff785a'   // Brick
            ],
            borderWidth: 0
        }]
    };
}

// Creating the data objects
const dataA = createDataObject([1, 2, 3, 4, 5]);
const dataB = createDataObject([5, 4, 3, 4, 5]);
const dataC = createDataObject([1, 2, 2, 3, 2]);


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
                        color: '#8f9a9a',
                        padding: 0,
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
                        family: 'Roboto Condensed, sans-serif',
                        size: 14,
                        weight: 'normal'
                    },
                    titleColor: 'black',
                    bodyFont: {
                        family: 'Roboto Condensed, sans-serif',
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
            toggleIcon.innerHTML = '<path d="M8 20l7-7-7-7" fill="transparent" stroke="#bfcdcd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'; // Change icon to ">"
        } else {
            // Expand the sidebar
            sidebar.style.transform = "translateX(0)"; // Move sidebar back onscreen
            toggleButton.style.left = "360px"; // Position the button at the sidebar's expanded edge
            toggleIcon.innerHTML = '<path d="M14 7l-7 7 7 7" fill="transparent" stroke="#bfcdcd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'; // Change icon to "<"
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




// Version History------------------------------------------------------
document.addEventListener("DOMContentLoaded", function() {
    const versionHistoryLink = document.getElementById('versionHistoryLink');
    const popup = document.getElementById('popup');
    const closePopup = document.getElementById('closePopup');
    const versionHistoryContent = document.getElementById('versionHistoryContent');

    // Fetch version history to update link text
    updateVersionHistory();

    // Add click event to the version history link
versionHistoryLink.addEventListener('click', function() {
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
            popup.style.display = 'flex';
        })
        .catch(error => {
            console.error('Fetch operation error:', error);
        });
});


    // Close the popup
    closePopup.addEventListener('click', function() {
        popup.style.display = 'none';
    });

    // Close popup when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    });
});

// Version history text update----------------------------
function updateVersionHistory() {
    fetch('version_history.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error loading version history file');
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
                    break; 
                }
            }

            const versionHistoryLink = document.getElementById('versionHistoryLink');
            if (versionHistoryLink && firstVersion) {
                versionHistoryLink.textContent = firstVersion;
            }
        })
        .catch(error => {
            console.error('Error fetching version history:', error);
        });
}






// Material popup
document.addEventListener('DOMContentLoaded', () => {
    const infoIcon = document.getElementById('materialInfo');
    const roseInfoIcon = document.getElementById('roseInfo');
    const materialPopup = document.getElementById('materialPopup');
    const rosePopup = document.getElementById('rosePopup');
    const closePopup = document.getElementById('collapsePopup'); 

    // Check if the closePopup button exists
    if (closePopup) {
        // This listener is for closing the popup when clicking the close button
        closePopup.addEventListener('click', (event) => {
            console.log("Close button clicked"); 
            event.stopPropagation(); // Prevent the click event from bubbling up
            materialPopup.classList.add('hidden'); // Trigger slide-up animation
            setTimeout(() => {
                materialPopup.style.display = 'none'; // Hide
            }, 500);
            rosePopup.classList.add('hidden'); // Trigger slide-up animation
            setTimeout(() => {
                rosePopup.style.display = 'none'; // Hide
            }, 500);
        });
    } 

    // Show the popup with animation when the info icon is clicked
    infoIcon.addEventListener('click', () => {
        console.log("Material popup clicked"); 
        materialPopup.classList.remove('hidden');
        materialPopup.style.display = 'flex'; // Ensure the popup is visible
    });

    roseInfoIcon.addEventListener('click', () => {
        console.log("Rose popup clicked"); 
        rosePopup.classList.remove('hidden');
        rosePopup.style.display = 'flex'; // Ensure the popup is visible
    });

    // Optional: Close the popup when clicking outside the content area
    materialPopup.addEventListener('click', (event) => {
        if (event.target === materialPopup) {
            closePopup.click();
        }
    });

    rosePopup.addEventListener('click', (event) => {
        if (event.target === rosePopup) {
            closePopup.click();
        }
    });
});











// Content text
document.addEventListener("DOMContentLoaded", function() {
    // Select content elements
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







// Fullscreen-popup--------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('popupFullscreen');
    const closePopup = document.getElementById('closePopup');
    const largeImage = document.getElementById('largeImage');
    const visualizationArchive = document.getElementById('visualizationArchive'); // The trigger
    const imageGallery = document.querySelector('.image-gallery'); // For dynamically adding thumbnails

    let thumbnailsGenerated = false;
    let currentIndex = 0; // Keep track of the current image index
    let imageArray = []; // Store image sources for navigation

    // Function to open the popup with the selected large image
    function openPopup(imageSrc) {
        largeImage.src = imageSrc;
        popup.style.display = 'flex';
    }

    // Function to initialize and add event listeners to thumbnails
    function setupThumbnails() {
        const thumbnails = document.querySelectorAll('.image-gallery img'); // Get thumbnails (dynamically updated)
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => {
                const largeSrc = thumbnail.getAttribute('data-large-src');
                openPopup(largeSrc);
                currentIndex = index; // Set current image index when clicked
            });
        });

        // Create an array of image sources for navigation
        imageArray = Array.from(thumbnails).map((thumbnail) => thumbnail.getAttribute('data-large-src'));
    }

    // Function to generate image gallery (thumbnails)
    function generateThumbnails() {
        if (thumbnailsGenerated) return; // Don't generate thumbnails again if already done

        const images = [
            "VA-01.webp", "VA-02.webp", "VA-03.webp", "VA-04.webp",
            "VA-05.webp", "VA-06.webp", "VA-07.webp", "VA-08.webp",
            "VA-09.webp", "VA-10.webp", "VA-11.webp", "VA-12.webp"
        ];

        images.forEach((image) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = `https://raw.githubusercontent.com/halfward/UrbanVein/main/media/${image}`;
            thumbnail.alt = `Thumbnail ${image}`;
            thumbnail.setAttribute('data-large-src', `https://raw.githubusercontent.com/halfward/UrbanVein/main/media/${image}`);
            imageGallery.appendChild(thumbnail);
        });

        setupThumbnails(); // Setup event listeners for the dynamically created thumbnails
        thumbnailsGenerated = true; // Set flag to true after thumbnails are generated
    }

    // Open the popup when clicking on the "Visualization Archive" text
    if (visualizationArchive) {
        visualizationArchive.addEventListener('click', () => {
            generateThumbnails(); // Generate and display thumbnails only once
            const firstThumbnail = imageGallery.querySelector('img');
            if (firstThumbnail) {
                openPopup(firstThumbnail.getAttribute('data-large-src')); // Default large image (first thumbnail)
                currentIndex = 0; // Set current image index to 0 for the first image
            }
        });
    }

    // Handle navigation using the arrow keys
    function handleKeyNavigation(event) {
        if (popup.style.display !== 'flex') return; // Only handle navigation if the popup is open

        if (event.key === 'ArrowLeft') {
            // Go to the previous image
            currentIndex = (currentIndex === 0) ? imageArray.length - 1 : currentIndex - 1;
        } else if (event.key === 'ArrowRight') {
            // Go to the next image
            currentIndex = (currentIndex === imageArray.length - 1) ? 0 : currentIndex + 1;
        }

        openPopup(imageArray[currentIndex]); // Update the large image based on the new index
    }

    // Add keydown event listener to handle arrow key navigation
    document.addEventListener('keydown', handleKeyNavigation);

    // Close the popup when the close button is clicked
    closePopup.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    // Close the popup when clicking outside the content area
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.style.display = 'none';
        }
    });
});








// Options
document.addEventListener("DOMContentLoaded", () => {
    const optionsIcon = document.getElementById("optionsIcon");
    const optionsPopup = document.getElementById("options-popup");
  
    optionsIcon.addEventListener("click", () => {
      // Toggle the display of the pop-up
      if (optionsPopup.style.display === "none" || optionsPopup.style.display === "") {
        optionsPopup.style.display = "block";
      } else {
        optionsPopup.style.display = "none";
      }
    });
  
    // Optional: Hide the pop-up if clicking outside of it
    document.addEventListener("click", (event) => {
      if (!optionsPopup.contains(event.target) && !optionsIcon.contains(event.target)) {
        optionsPopup.style.display = "none";
      }
    });
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





// Dynamic Scrollable Text Height - Explorer
    function updateMaxHeightExplorer() {
        const totalHeight =
            (document.querySelector('#logo')?.offsetHeight || 0) +
            (document.querySelector('#aboutButton')?.offsetHeight || 0) +
            (document.querySelector('#exploreContentText')?.offsetHeight || 0) +
            (document.querySelector('#navButtonCContainer')?.offsetHeight || 0) +
            (document.querySelector('#layerControls')?.offsetHeight || 0) +
            (document.querySelector('.sidebar-bottom-buttons')?.offsetHeight || 0) +
            308;
    
        const scrollableTextElement = document.querySelector('.scrollable-text-c'); // Target element
        if (scrollableTextElement) {
            scrollableTextElement.style.maxHeight = `calc(100vh - ${totalHeight}px)`;
        }
    }
    
    // Run on page load
    updateMaxHeightExplorer();
    
    // Add event listener to handle dynamic resizing
    window.addEventListener('resize', updateMaxHeightExplorer);





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
    