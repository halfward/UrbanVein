// Map Load ------------------------------------------
// Initialize the main map on the left without a basemap
const mainMap = L.map('map', {
    center: [40.7128, -74.0060], // Center on NYC
    zoom: 13,
    renderer: L.svg(), // SVG renderer
    preferCanvas: true, // Use canvas when possible for better performance
    layers: [] // No base layer for mainMap
});

// Initialize the satellite map on the right (initially hidden)
const satelliteMapContainer = document.createElement('div');
satelliteMapContainer.id = 'satelliteMap';
satelliteMapContainer.style.position = 'absolute';
satelliteMapContainer.style.right = '0';
satelliteMapContainer.style.top = '0';
satelliteMapContainer.style.width = '50%';
satelliteMapContainer.style.height = '100%';
document.body.appendChild(satelliteMapContainer);

const satelliteMap = L.map('satelliteMap', {
    center: [40.7128, -74.0060],
    zoom: 13
});

// Only add the basemap to the satellite map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(satelliteMap);

// Define colors for each material
const materialColors = {
    steel: '#ff2056',    // Pink for steel
    brick: '#e120ff',    // Purple for brick
    concrete: '#ffd200', // Yellow for concrete
    glass: '#008eff',    // Blue for glass
    stone: '#50d173'    // Green for stone
};

// Define offsets for each material
const materialOffsets = {
    brick: { lat: 0.0003, lng: -0.0003 },    // Up and left
    stone: { lat: 0.0003, lng: 0.0003 },     // Up and right
    concrete: { lat: -0.0003, lng: -0.0003 }, // Down and left
    glass: { lat: -0.0003, lng: 0.0003 }     // Down and right
};

// Function to add markers in batches based on material type
const addMaterialMarkersBatch = (geojsonData, material, color) => {
    const filteredFeatures = geojsonData.features.filter(feature => feature.properties[material] > 0);
    const binnedDataValues = filteredFeatures.map(feature => feature.properties[material]);
    const quantiles = d3.scaleQuantile()
        .domain(binnedDataValues)
        .range([0, 0.4, 0.8, 1.2, 1.6, 2, 2.4, 2.8]);

    let index = 0; // Initial index for batch processing
    const batchSize = 50; // Adjust this value to control batch size

    function addMarkersBatch() {
        const features = filteredFeatures.slice(index, index + batchSize);
        features.forEach(feature => {
            const coordinates = feature.geometry.coordinates;
            const sizeMultiplier = quantiles(feature.properties[material]);

            // Apply offset based on material type
            let lat = coordinates[1];
            let lng = coordinates[0];
            if (materialOffsets[material]) {
                lat += materialOffsets[material].lat;
                lng += materialOffsets[material].lng;
            }

            if (sizeMultiplier > 0) {
                const baseRadius = 15; // Base radius in meters
                const minRadius = 5;
                const circle = L.circle([lat, lng], {
                    radius: Math.max(baseRadius * sizeMultiplier, minRadius), // Enforce minimum size
                    color: color,
                    fillColor: color,
                    weight: 0,
                    fillOpacity: 0.5,
                    opacity: 1,
                    fillRule: 'evenodd',
                    className: `leaflet-circle-${material} leaflet-circle-blend-${material}`, // Unique blend class for each material
                });

                circle.bindTooltip(`I have ${feature.properties[material]} tons of ${material}`, {
                    permanent: false,
                    direction: 'top',
                    sticky: true,
                    opacity: 1
                });

                circle.addTo(mainMap);
            }
        });

        // Update the index for the next batch
        index += batchSize;

        // Schedule the next batch if there are more features to add
        if (index < filteredFeatures.length) {
            setTimeout(addMarkersBatch, 0); // Call next batch in the queue
        }
    }

    // Start adding markers in batches
    addMarkersBatch();
};


// Load GeoJSON data and add markers for each material in batches
d3.json('data/centroid_all.geojson').then(geojsonData => {
    addMaterialMarkersBatch(geojsonData, 'steel', materialColors.steel);
    addMaterialMarkersBatch(geojsonData, 'brick', materialColors.brick);
    addMaterialMarkersBatch(geojsonData, 'glass', materialColors.glass);
    addMaterialMarkersBatch(geojsonData, 'concrete', materialColors.concrete);
    addMaterialMarkersBatch(geojsonData, 'stone', materialColors.stone);
}).catch(error => {
    console.error('Error loading centroid GeoJSON:', error);
});




// Satellite Map Toggle ------------------------------------------
// Variable to track satellite map visibility
let isSatelliteMapVisible = false;

// Function to toggle the satellite map visibility
const toggleSatelliteMap = () => {
    // If the satellite map is currently hidden, show it
    if (!isSatelliteMapVisible) {
        isSatelliteMapVisible = true; // Update the state
        document.getElementById('map').classList.add('map-left');
        satelliteMapContainer.classList.add('satellite-map-active');
    }
    // If it's already visible, do nothing
};

// Event listener for the satellite map button
document.querySelector('.nav-button-2:nth-child(3)').addEventListener('click', toggleSatelliteMap);

// Function to hide the satellite map
const hideSatelliteMap = () => {
    // Only hide if it's currently visible
    if (isSatelliteMapVisible) {
        isSatelliteMapVisible = false; // Update the visibility state
        document.getElementById('map').classList.remove('map-left');
        satelliteMapContainer.classList.remove('satellite-map-active');
    }
};

// Add event listeners to the other nav-button-2 elements
const otherButtons = document.querySelectorAll('.nav-button-2:not(:nth-child(3))');
otherButtons.forEach(button => {
    button.addEventListener('click', hideSatelliteMap);
});



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

        // Adjust satellite map width based on the new state
        adjustSatelliteMapWidth();
    });

    // Initialize the sidebar in the expanded state on load
    sidebar.style.transform = "translateX(0)"; // Ensure the sidebar is expanded initially
});

// Function to adjust the satellite map width based on the sidebar state
function adjustSatelliteMapWidth() {
    const sidebarWidth = document.getElementById("sidebar").offsetWidth; // Get the sidebar width
    const satelliteMapWidth = isSidebarExpanded ? (window.innerWidth / 2 - 180) : (window.innerWidth / 2); // Adjust width based on state

    // Set the width of the satellite map container
    satelliteMapContainer.style.width = `${satelliteMapWidth}px`;
}



// Nav Button
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



// Content text
document.addEventListener("DOMContentLoaded", function() {
    // Select content elements
    const aboutContent = document.getElementById('aboutContentText');
    const storiesContent = document.getElementById('storiesContentText');
    const exploreContent = document.getElementById('exploreContentText');
    const navButton2Container = document.getElementById('navButton2Container');
    const additionalSidebarLine = document.getElementById('additionalSidebarLine'); // Ensure this exists in your HTML

    // Function to update content based on button clicked
    function updateContent(buttonId) {
        // Hide all content divs
        aboutContent.style.display = 'none';
        storiesContent.style.display = 'none';
        exploreContent.style.display = 'none';

        // Show relevant content based on button ID
        switch (buttonId) {
            case 'aboutButton':
                aboutContent.style.display = 'block';
                navButton2Container.style.display = 'none'; // Hide nav buttons 2
                additionalSidebarLine.style.display = 'none'; // Hide additional sidebar line
                break;
            case 'storiesButton':
                storiesContent.style.display = 'block';
                navButton2Container.style.display = 'none'; // Hide nav buttons 2
                additionalSidebarLine.style.display = 'none'; // Hide additional sidebar line
                break;
            case 'explorerButton':
                exploreContent.style.display = 'block';
                navButton2Container.style.display = 'block'; // Show nav buttons 2
                additionalSidebarLine.style.display = 'block'; // Show additional sidebar line
                break;
            default:
                // In case of an unknown buttonId
                aboutContent.style.display = 'none';
                storiesContent.style.display = 'none';
                exploreContent.style.display = 'none';
                navButton2Container.style.display = 'none'; // Hide nav buttons 2
                additionalSidebarLine.style.display = 'none'; // Hide additional sidebar line
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
    updateContent('explorerButton'); // Change this to 'aboutButton' if you want about to be default
});



// Second Tab Logic

// Select the Explore button (first layer)
const exploreButton = document.getElementById('explorerButton');
const aboutButton = document.getElementById('aboutButton');
const storiesButton = document.getElementById('storiesButton');

// Select all nav-2 buttons (second layer)
const navButtons = document.querySelectorAll('.nav-button-2');
const circle = document.getElementById('circle'); // Get the circle element
const scrollableText = document.getElementById('scrollableText'); // Get the scrollable text container

// Variables to track button states
let isExploreActive = false;
let isLegendActive = false;

// Function to update display of elements based on both button states
function updateDisplayElements() {
    const shouldDisplay = isExploreActive && isLegendActive;
    
    // Show or hide the elements based on the combined active state
    circle.style.display = shouldDisplay ? 'block' : 'none';
    scrollableText.style.display = shouldDisplay ? 'block' : 'none';
}

// Function to update content based on the second-layer button clicked
function updateContent(buttonId) {
    console.log('Updating content for:', buttonId); // Debug log
    isLegendActive = (buttonId === 'legendButton'); // Track if Legend button is active
    updateDisplayElements(); // Update display elements based on both button states
}

// Add click event listeners to main navigation buttons to track Explore state
exploreButton.addEventListener('click', () => {
    isExploreActive = true; // Set Explore as active
    updateDisplayElements(); // Check if elements should be displayed
});
aboutButton.addEventListener('click', () => {
    isExploreActive = false; // Unset Explore if About is clicked
    updateDisplayElements();
});
storiesButton.addEventListener('click', () => {
    isExploreActive = false; // Unset Explore if Stories is clicked
    updateDisplayElements();
});

// Add click event listener to each second-layer button
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
isLegendActive = true; // Pre-select Legend as active
document.getElementById('legendButton').classList.add('active'); // Add active class to Legend button
updateDisplayElements(); // Ensure elements are displayed on page load if needed





// Version history -----------------------------------------
document.addEventListener("DOMContentLoaded", function() {
    const versionHistoryLink = document.getElementById('versionHistoryLink');
    const popup = document.getElementById('popup');
    const closePopup = document.getElementById('closePopup');
    const versionHistoryContent = document.getElementById('versionHistoryContent');

    // Add click event to the version history link
    versionHistoryLink.addEventListener('click', function() {
        // Fetch the version history from the text file
        fetch('version_history.txt') // Ensure this file exists in the same directory
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                versionHistoryContent.textContent = data; // Set the content
                popup.style.display = 'flex'; // Show the popup
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    });

    // Close the popup when the close button is clicked
    closePopup.addEventListener('click', function() {
        popup.style.display = 'none'; // Hide the popup
    });

    // Close the popup if the user clicks anywhere outside of the popup
    window.addEventListener('click', function(event) {
        if (event.target === popup) {
            popup.style.display = 'none'; // Hide the popup
        }
    });
});
