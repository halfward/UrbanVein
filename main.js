document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('GuideOverlay');
    const dontShowAgain = document.getElementById('dontShowAgain');
    const guideButton = document.getElementById('guideButton'); 

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

    // Event listener
    guideButton.addEventListener('click', () => {
        overlay.style.display = 'flex';
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
    steel: '#b200ff',    // Purple for steel
    brick: '#ff3829',    // Orange for brick
    concrete: '#ffe300', // Yellow for concrete
    glass: '#39fa7a',    // Green for glass
    stone: '#007bff'     // Blue for stone
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

            // Bind the tooltip to the click event
            circle.on('click', function() {
                const tooltipContent = `Average FAR<br>Average Building Age<br>Prominent Material<br>I have ${feature.properties[material]} kgs of ${material}`;
                circle.bindPopup(tooltipContent).openPopup();  // Use bindPopup to show the content
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
        // Add the GeoJSON layer with style options to make it a background layer
        const coastlineLayer = L.geoJSON(data, {
            style: {
                weight: 0,               
                fillColor: 'white',
                fillOpacity: .5          
            }
        }).addTo(mainMap);

        coastlineLayer.bringToBack(); 
    })
    .catch(error => console.error('Error loading GeoJSON:', error));









// Load Hex GeoJSON (hex_all.geojson)-------------------------------
fetch('https://raw.githubusercontent.com/halfward/UrbanVein/main/data/hex_all.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error('Error loading GeoJSON file');
        }
        return response.json();
    })
    .then(geojsonData => {
        const materials = ['brick', 'concrete', 'glass', 'stone', 'steel', ];
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
            values.sort((a, b) => a - b);  // Ascending order sort
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
                    return i;  // Return the class index (0-5)
                }
            }
            return quantiles.length - 1; // If the value is higher than the last quantile
        }

        // Add geoJSON layer and bind mouseover event
        const geojsonLayer = L.geoJSON(geojsonData, {
            style: {
                weight: 0,
                opacity: 0,
                fillOpacity: 0
            },
            interactive: true,
            onEachFeature: (feature, layer) => {
                layer.on('mouseover', () => {
                    // Extract values for the hovered feature
                    let materialData = materials.map(material => {
                        const materialKey = `binned_data_${material}_sum`;
                        const materialValue = feature.properties[materialKey];
                        if (materialValue) {
                            const binIndex = getQuantileBin(materialValue, quantiles[material]);
                            return binIndex;
                        }
                        return 0;  // Default to 0 if no data
                    });

                    // Update the rose chart data based on the material data
                    RoseChart.data.datasets[0].data = materialData;
                    RoseChart.update();
                });
            }
        }).addTo(mainMap);

        // Set the z-index to ensure it's above any other layers
        geojsonLayer.setZIndex(10);
    })
    .catch(error => {
        console.error('Error loading GeoJSON data:', error);
    });




// Rose Chart------------------------------------------------------------
const data = {
    labels: ['Steel', 'Stone', 'Glass', 'Concrete', 'Brick'],
    datasets: [{
        label: 'Total weight (t)',
        data: [0, 0, 0, 0, 0],  // Initialize with zero
        backgroundColor: [
            '#dd75ff',
            '#6bcbff',
            '#6af1bd',
            '#ffdd32',
            '#fd8564'
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
                    color: 'rgba(0, 0, 0, 0.2)', 
                    lineWidth: 1, 
                    z: 1 
                },
                angleLines: {
                    color: 'rgba(0, 0, 0, 0.2)',
                    lineWidth: 1,
                    z: 1 
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
                    family: 'Bahnschrift, sans-serif', 
                    size: 14,
                    weight: 'normal'
                },
                titleColor: 'black', 
                bodyFont: {
                    family: 'Bahnschrift, sans-serif', 
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

// Quantile calculation
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
                return response.text();
            })
            .then(data => {
                versionHistoryContent.textContent = data;
                popup.style.display = 'flex';
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
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
            for (let i = 0; i < lines.length; i++) { // Start from the first line
                if (lines[i].startsWith('Version')) {
                    firstVersion = lines[i].trim();
                    break; // Stop as soon as the first version is found
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










// Content text
document.addEventListener("DOMContentLoaded", function() {
    // Select content elements
    const aboutContent = document.getElementById('aboutContentText');
    const storiesContent = document.getElementById('storiesContentText');
    const exploreContent = document.getElementById('exploreContentText');
    const navButtonAContainer = document.getElementById('navButtonAContainer');
    const navButtonBContainer = document.getElementById('navButtonBContainer');
    const navButtonCContainer = document.getElementById('navButtonCContainer');
    const additionalSidebarLine = document.querySelector('.sidebar-line-2');


    // Function to update content based on button clicked
    function updateContent(buttonId) {
        // Hide all content divs
        aboutContent.style.display = 'none';
        storiesContent.style.display = 'none';
        exploreContent.style.display = 'none';

        // Hide all nav button containers initially
        navButtonAContainer.style.display = 'none';
        navButtonBContainer.style.display = 'none';
        navButtonCContainer.style.display = 'none';
        additionalSidebarLine.style.display = 'none'; 

        // Show relevant content based on button ID
        switch (buttonId) {
            case 'aboutButton':
                aboutContent.style.display = 'block';
                navButtonAContainer.style.display = 'flex'; 
                additionalSidebarLine.style.display = 'block'; 
                break;
            case 'storiesButton':
                storiesContent.style.display = 'block';
                navButtonBContainer.style.display = 'flex'; 
                additionalSidebarLine.style.display = 'block';
                break;
            case 'explorerButton':
                exploreContent.style.display = 'block';
                navButtonCContainer.style.display = 'flex'; 
                additionalSidebarLine.style.display = 'block'; 
                break;
            default:
                aboutContent.style.display = 'none';
                storiesContent.style.display = 'none';
                exploreContent.style.display = 'none';
                navButtonAContainer.style.display = 'none'; 
                navButtonBContainer.style.display = 'none'; 
                navButtonCContainer.style.display = 'flex'; 
                additionalSidebarLine.style.display = 'block'; 
        }
    }

    // Attach event listeners to buttons
    document.getElementById('aboutButton').addEventListener('click', function() {
        updateContent('aboutButton');
    });

    document.getElementById('storiesButton').addEventListener('click', function() {
        updateContent('storiesButton');
    });

    document.getElementById('explorerButton').addEventListener('click', function() {
        updateContent('explorerButton');
    });

    // Initialize by showing the Explorer content or any default section
    updateContent('explorerButton');
});





// Second Tab Logic

// Select the main buttons (first layer)
const exploreButton = document.getElementById('explorerButton');
const aboutButton = document.getElementById('aboutButton');
const storiesButton = document.getElementById('storiesButton');

// Select all nav-2 buttons (second layer)
const navButtons = document.querySelectorAll('.nav-button-2');

const scrollableTextData = document.getElementById('scrollableTextData'); 
const scrollableTextMedia = document.getElementById('scrollableTextMedia'); 
const scrollableTextRef = document.getElementById('scrollableTextRef'); 

const scrollableTextPast = document.getElementById('scrollableTextPast'); 
const scrollableTextPresent = document.getElementById('scrollableTextPresent'); 
const scrollableTextFuture = document.getElementById('scrollableTextFuture'); 

const scrollableTextC = document.getElementById('scrollableTextC'); 
const roseChart = document.getElementById('RoseChart'); 
const layerControls = document.getElementById('layerControls');

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


function updateDisplay(element, condition) {
    element.style.display = condition ? 'block' : 'none';
}

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
    updateDisplay(roseChart, shouldDisplay);
    updateDisplay(scrollableTextC, shouldDisplay);
    updateDisplay(layerControls, shouldDisplay);
}


// Function to update content based on second-layer button clicked
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
    

    // Update the display elements for different states
    updateAboutAndDataDisplay();
    updateAboutAndMediaDisplay();
    updateAboutAndRefDisplay();

    updateStoriesAndPastDisplay();
    updateStoriesAndPresentDisplay();
    updateStoriesAndFutureDisplay();

    updateExploreAndLegendDisplay();
}

// Add click event listeners to main navigation buttons to track About, Stories, and Explore states
exploreButton.addEventListener('click', () => {
    isExploreActive = true;   // Set Explore as active
    isAboutActive = false;    // Unset About
    isStoriesActive = false;  // Unset Stories

    // Automatically activate the legendButton
    isLegendActive = true;
    navButtons.forEach(btn => btn.classList.remove('active')); // Remove 'active' from all buttons
    document.getElementById('legendButton').classList.add('active'); // Add 'active' to legendButton

    updateAboutAndDataDisplay();
    updateAboutAndMediaDisplay();
    updateAboutAndRefDisplay();

    updateStoriesAndPastDisplay();
    updateStoriesAndPresentDisplay();
    updateStoriesAndFutureDisplay();

    updateExploreAndLegendDisplay();
});

aboutButton.addEventListener('click', () => {
    isAboutActive = true;    // Set About as active
    isExploreActive = false; // Unset Explore
    isStoriesActive = false; // Unset Stories

    // Automatically activate the dataButton
    isDataActive = true;
    navButtons.forEach(btn => btn.classList.remove('active')); // Remove 'active' from all buttons
    document.getElementById('dataButton').classList.add('active'); // Add 'active' to dataButton

    updateAboutAndDataDisplay();
    updateAboutAndMediaDisplay();
    updateAboutAndRefDisplay();

    updateStoriesAndPastDisplay();
    updateStoriesAndPresentDisplay();
    updateStoriesAndFutureDisplay();
    
    updateExploreAndLegendDisplay();
});


storiesButton.addEventListener('click', () => {
    isAboutActive = false;   // Unset About
    isExploreActive = false; // Unset Explore
    isStoriesActive = true;  // Set Stories as active

    // Automatically activate the pastButton
    isPastActive = true;
    navButtons.forEach(btn => btn.classList.remove('active')); // Remove 'active' from all buttons
    document.getElementById('pastButton').classList.add('active'); // Add 'active' to pastButton

    updateAboutAndDataDisplay();
    updateAboutAndMediaDisplay();
    updateAboutAndRefDisplay();

    updateStoriesAndPastDisplay();
    updateStoriesAndPresentDisplay();
    updateStoriesAndFutureDisplay();
    
    updateExploreAndLegendDisplay();
});

// Add click event listener to each second-layer button in navButtonAContainer, navButtonBContainer, and navButtonCContainer
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        console.log('Button clicked:', button.id); // Debug log
        // Remove 'active' class from all buttons
        navButtons.forEach(btn => btn.classList.remove('active'));

        // Add 'active' class to the clicked button
        button.classList.add('active');

        // Update content based on the selected button
        updateContent(button.id);
    });
});

// Set initial states on page load
isExploreActive = true; // Pre-select Explore as active
isLegendActive = true;  // Pre-select Legend as active
document.getElementById('legendButton').classList.add('active'); 
updateAboutAndDataDisplay();
updateAboutAndMediaDisplay();
updateAboutAndRefDisplay();

updateStoriesAndPastDisplay();
updateStoriesAndPresentDisplay();
updateStoriesAndFutureDisplay();
    
updateExploreAndLegendDisplay();





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
