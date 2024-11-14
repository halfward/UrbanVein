// Map Load ------------------------------------------
// Define NYC bounds (approximate)
const nycBounds = L.latLngBounds(
    [40.4774, -74.2591], // Southwest corner (Staten Island area)
    [40.9176, -73.7004]  // Northeast corner (Bronx/Westchester area)
);

// Initialize the main map with these bounds
const mainMap = L.map('map', {
    center: [40.7128, -74.0060], // Center on NYC
    zoom: 13,
    minZoom: 11,
    maxZoom: 15,
    renderer: L.canvas(),
    preferCanvas: true,
    maxBounds: nycBounds, // Set max bounds to NYC area
    maxBoundsViscosity: 1.0 // Makes bounds "sticky" to prevent panning outside
});

// Optionally, fit the map to these bounds initially
mainMap.fitBounds(nycBounds);


// Create the rectangle 
const rectangle = L.rectangle(
    [[40.666, -74.044], [40.915, -73.868]], 
    {
        color: '#e1e7e7',
        weight: 0,         
        fillOpacity: 1,    
        fillColor: 'white'
    }
).addTo(mainMap);


// Create a Layer Group for both image overlay and GeoJSON
const imageOverlayGroup = L.layerGroup().addTo(mainMap);

// Add the image overlay first with a lower z-index
const southWest = [40.666, -74.044];
const northEast = [40.915, -73.868];
const bounds = [southWest, northEast];
const imageUrl = 'images/map.png';

fetch(imageUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Image not found');
        }
        // Add the image overlay with a lower zIndex
        L.imageOverlay(imageUrl, bounds, {
            className: 'custom-blend-overlay',
            zIndex: 0 // Lower zIndex for the image (background layer)
        }).addTo(imageOverlayGroup);
    })
    .catch(error => {
        console.error('Error loading image:', error);
    });


// Load GeoJSON
fetch('data/new-york-city-boroughs.geojson')
.then(response => {
    if (!response.ok) {
        throw new Error('Error loading GeoJSON file');
    }
    return response.json();
})
.then(geojsonData => {
    // Add GeoJSON to the map with style and class
    const geojsonLayer = L.geoJSON(geojsonData, {
        style: {
            color: 'black',
            weight: 0.1,
            opacity: 1,
            fillColor: 'white',
            fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
            // Add class to each feature's path (polygon)
            if (layer instanceof L.Path && layer._path) {
                layer._path.classList.add('geojson-blend');
            }
        }
    }).addTo(mainMap);

    // Adjust the map bounds to fit GeoJSON data
    mainMap.fitBounds(geojsonLayer.getBounds());
})
.catch(error => {
    console.error('Error loading GeoJSON data:', error);
});





// Load GeoJSON (hex_all.geojson)
fetch('data/hex_all.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error('Error loading GeoJSON file');
        }
        return response.json();
    })
    .then(geojsonData => {
        // Extract material values from the GeoJSON data
        const materialValues = {
            steel: geojsonData.features.map(feature => feature.properties['binned_data_steel_sum']).filter(value => value !== undefined && value !== null),
            concrete: geojsonData.features.map(feature => feature.properties['binned_data_concrete_sum']).filter(value => value !== undefined && value !== null),
            stone: geojsonData.features.map(feature => feature.properties['binned_data_stone_sum']).filter(value => value !== undefined && value !== null),
            glass: geojsonData.features.map(feature => feature.properties['binned_data_glass_sum']).filter(value => value !== undefined && value !== null),
            brick: geojsonData.features.map(feature => feature.properties['binned_data_brick_sum']).filter(value => value !== undefined && value !== null)
        };

        // Calculate quantiles (5 quantiles) for each material
        const quantiles = {
            steel: calculateQuantiles(materialValues.steel, 5),
            concrete: calculateQuantiles(materialValues.concrete, 5),
            stone: calculateQuantiles(materialValues.stone, 5),
            glass: calculateQuantiles(materialValues.glass, 5),
            brick: calculateQuantiles(materialValues.brick, 5)
        };
        console.log('Quantiles:', quantiles);

        // Circle colors
        const circleColors = {
            steel: 'red',
            concrete: 'gray',
            stone: 'brown',
            glass: 'green',
            brick: 'red'
        };

        // Define circle sizes (corresponding to quantiles) for each material
        const circleSizes = [30, 60, 90, 120, 150]; // 5 distinct sizes

        // Function to calculate quantiles (break points for material values)
        function calculateQuantiles(values, numQuantiles) {
            const sortedValues = values.slice().sort((a, b) => a - b);  // Sort values in ascending order
            const quantileValues = [];
            for (let i = 1; i < numQuantiles; i++) {
                const quantileIndex = Math.floor(i * sortedValues.length / numQuantiles);
                quantileValues.push(sortedValues[quantileIndex]);
            }
            return quantileValues;
        }

        // Function to map material value to a quantile and return corresponding circle size and color
        function getCircleSizeAndColor(material, materialValue) {
            let size = circleSizes[circleSizes.length - 1]; // Default to the largest size
            let color = circleColors[material];  // Default color

            const quantile = quantiles[material];
            for (let i = 0; i < quantile.length; i++) {
                if (materialValue <= quantile[i]) {
                    size = circleSizes[i];
                    break;
                }
            }
            return { size, color };
        }

        // Create separate circles for each material, positioned side by side
        const centerCoordinates = [40.7128, -74.0060]; 
        const circleOffset = 20; 

        const circles = {};

        // Initialize a circle for each material
        Object.keys(circleColors).forEach((material, index) => {
            const offsetX = index * (circleSizes[circleSizes.length - 1] + circleOffset); // Offset circles side by side
            circles[material] = L.circle([centerCoordinates[0], centerCoordinates[1] + offsetX], {
                color: circleColors[material],
                fillColor: circleColors[material],
                fillOpacity: 0.5,
                radius: circleSizes[0],  // Initial size (smallest size)
                className: `${material}-circle`,
                opacity: 0.8 // Set the initial opacity for the circle
            }).addTo(mainMap);
        });

        // Set the view of the map to ensure the circles are visible
        mainMap.setView(centerCoordinates, 13);  // Adjust zoom level to fit all circles

        // Adding the Hex layer and tooltips
        const geojsonLayer = L.geoJSON(geojsonData, {
            style: {
                weight: 0,
                opacity: 0,
                fillOpacity: 0
            },
            interactive: true,   // Ensure features are interactive
            onEachFeature: (feature, layer) => {
                if (feature.geometry && feature.geometry.coordinates) {
                    if (feature.properties) {
                        // Array of materials to check in the properties
                        const materials = ['steel', 'concrete', 'stone', 'glass', 'brick'];
                        let tooltipContent = ''; // Start with an empty content string

                        // Iterate over the materials and add the corresponding value from binned_data_*_sum
                        materials.forEach(material => {
                            const materialKey = `binned_data_${material}_sum`;
                            const materialValue = feature.properties[materialKey];

                            if (materialValue) {
                                tooltipContent += `<strong>${material.charAt(0).toUpperCase() + material.slice(1)}:</strong> ${materialValue}<br>`;
                            }
                        });

                        // Only bind the tooltip if there is any content (i.e., a material with data)
                        if (tooltipContent) {
                            // Bind the tooltip to the layer
                            layer.bindTooltip(tooltipContent, {
                                permanent: false,
                                direction: 'top',
                                className: 'geojson-tooltip',
                                interactive: true
                            });
                        }

                        // On hover, adjust the circle size for each material
                        layer.on('mouseover', function () {
                            materials.forEach(material => {
                                const materialValue = feature.properties[`binned_data_${material}_sum`];
                                if (materialValue) {
                                    const { size } = getCircleSizeAndColor(material, materialValue);
                                    circles[material].setRadius(size);  // Update the circle size with a smooth transition
                                    console.log(`${material} Value: ${materialValue}, Circle Size: ${size}`); // Debugging line
                                }
                            });
                        });

                        // Reset the circle size and color on mouseout
                        layer.on('mouseout', function () {
                            materials.forEach(material => {
                                const initialSize = circleSizes[0];
                                circles[material].setRadius(initialSize);  // Reset to initial size with a smooth transition
                            });
                        });
                    }
                }
            }
        }).addTo(mainMap);

        // Set the z-index to ensure it's above any other layers
        geojsonLayer.setZIndex(10);
    })
    .catch(error => {
        console.error('Error loading GeoJSON data:', error);
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



function updateVersionHistory() {
    // Fetch the version history file
    fetch('version_history.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error loading version history file');
            }
            return response.text();
        })
        .then(data => {
            // Split the content by new lines
            const lines = data.split('\n');
            
            // Find the last line starting with "Version"
            let latestVersion = '';
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].startsWith('Version')) {
                    latestVersion = lines[i].trim(); // Get the version line and remove extra whitespace
                    console.log('Latest Version Found:', latestVersion); // Log the latest version found
                    break;
                }
            }

            // If a version is found, update the text content
            const versionHistoryLink = document.getElementById('versionHistoryLink');
            if (versionHistoryLink && latestVersion) {
                versionHistoryLink.textContent = latestVersion;
            } else {
                console.log('Version history link or latest version not found');
            }
        })
        .catch(error => {
            console.error('Error fetching version history:', error);
        });
        
}

// Call the function when the page loads
window.onload = updateVersionHistory;






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
    updateContent('explorerButton');
});



// Second Tab Logic

// Select the Explore button (first layer)
const exploreButton = document.getElementById('explorerButton');
const aboutButton = document.getElementById('aboutButton');
const storiesButton = document.getElementById('storiesButton');

// Select all nav-2 buttons (second layer)
const navButtons = document.querySelectorAll('.nav-button-2');
const circle = document.getElementById('circle'); // Get the general circle element
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


    // Optionally, you can update the steel circle's properties (e.g., size) based on button states
    if (shouldDisplay && steelCircle) {
        const steelValue = getSteelValueForSteelCircle();  // You need to define how to get the steel value
        const newRadius = getCircleSize(steelValue);  // Adjust the size logic based on your quantile logic
        steelCircle.setRadius(newRadius);  // Update the radius of the steel circle dynamically
    }
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





// Dynamic Circle
const circleContainer = document.getElementById('circle-container');

// Function to create circles dynamically in HTML
function createCircle(material, materialValue) {
    const { size, color } = getCircleSizeAndColor(material, materialValue);

    const circleDiv = document.createElement('div');
    circleDiv.classList.add('circle');
    circleDiv.style.backgroundColor = color;
    circleDiv.style.width = `${size}px`;
    circleDiv.style.height = `${size}px`;

    // Append the circle to the container
    circleContainer.appendChild(circleDiv);
}

// For demonstration, create circles for each material (assuming you have materialValues)
Object.keys(materialValues).forEach(material => {
    const materialValue = materialValues[material][0]; // Example: use the first value from materialValues array
    createCircle(material, materialValue);
});

// Update circle sizes based on material values from the GeoJSON (as per your original logic)
function updateCircleSize(material, materialValue) {
    const circles = document.querySelectorAll(`.${material}-circle`);
    const { size } = getCircleSizeAndColor(material, materialValue);
    circles.forEach(circle => {
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
    });
}

// Example usage: Update the size of a specific material
updateCircleSize('steel', 50);
