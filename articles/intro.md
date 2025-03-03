# 嗨, Welcome to Urban Vein

By mapping the material composition of New York City’s buildings, we can uncover patterns of urban transformation that inform preservation, demolition, and future construction decisions.

The full data & reference lists can be found in the "database" panel on the top-left corner in the map space.

<section id="chapter-what" class="chapter-section">
    <h2>What is Urban Vein?</h2>
    <br>
    <h3>A dynamic web platform for the documentation & speculation of NYC's building materials.</h3>
    <div class="chapter">
        <img src="images/guide-diagram.png" alt="Guide Diagram">
        <p>
        <b>asdf</b><br>
        Urban Vein bridges computation, design, and storytelling, offering spatial decision-makers the tools to identify trends and uncover patterns. It visualizes material archetypes across scales and explores temporal dimensions through historical and speculative narratives. At stake is the question of sustainability and urban memory. Urban Vein invites us to consider how material knowledge might guide responsible design practices in an ever-changing cityscape.
        </p>
    </div>
    <blockquote>
        All data are local. Indeed, data are cultural artifacts created by people, and their dutiful machines, at a time, in a place, and with the instruments at hand for audiences that are conditioned to receive them. -Yanni Loukissas, “From Data Sets to Data Settings,” in All Data are Local
    </blockquote>
    <div class="chapter">
        <p>
            This project originally started as...asdfasdf
            There were three directions I wanted to go in: balloonify, ..., and logistics. (images on the left.)
        </p>
    </div>
    <blockquote>
        The basic proposition employed is that any place is the sum of historical, physical and biological processes, that these are dynamic, that they constitute social values, that each area has an intrinsic suitability for certain land uses and finally, that certain areas lend themselves to multiple coexisting land uses. - McHarg, I., 1970. Processes as Values, in Design with Nature. Wiley, New York, pp. 102–115.
    </blockquote>
</section>

<section id="chapter-why" class="chapter-section">
    <h2>Why Is This Important?</h2>
    <br>
    <h3>A computational "census" for NYC bulidings.</h3>
    <blockquote>
        We need more pluralism in design, not of style but of ideology and values. - Anthony Dunne and Fiona Raby: Speculate Everything, Chapter 1-3, pp.1-47.
    </blockquote>
    <p>
        It all started with a lack of data.
        <br>
        Life cycle assessments, limited land, and soaring material prices due to raw material shortage and political stress. Inspired by urban miners, who are city-scavenging... cycle economy, there's never been a better time to reassess our built environment from a material standpoint.
    </p>
    <blockquote>
        If every building is both an addition and a subtraction, every act of unbuilding is also both a subtraction and an addition. - Easterling, Keller, “Subtraction”, 2003.
    </blockquote>
    <p>
        Urban Vein is an analytic and narrative tool that explores material histories, promotes sustainable urban practices, and challenges conventional demolition-preservation dynamics. It operates across scales—from the micro (individual buildings) to the macro (city-wide trends)—while fostering new practices in spatial storytelling.
    </p>
    <p>
        Through its focus on material life cycles and speculative timelines, Urban Vein invites users to engage with critical questions of sustainability and urban identity, presenting data in an interactive, participatory manner. The platform prioritizes user accessibility and narrative clarity, aiming to inspire informed decision-making for the built environment.
    </p>
    <p>
        I've always taken a fondness on how Karl Popper approaches science in terms of replication. Since my program resides in the "of sciences" realm, it makes sense to adhere to this line of thinking when producing and structuring the design:
    </p>
    <blockquote>
        We do not take even our own observations quite seriously, or accept them as scientific observations, until we have repeated and tested them. Only by such repetitions can we convince ourselves that we are not dealing with a mere isolated ‘coincidence,' but with events which, on account of their regularity and reproducibility, are in principle inter-subjectively testable.
    </blockquote>
    <p>
        With that in mind, this article is geared towards explaining how this project came to fruition and documenting it in a way that is concise (bear with my occasional ramblings due to the diarial nature of the page) and its results easily replicable. 
    </p>
</section>

<section id="chapter-how" class="chapter-section">
    <h2>How Does It Work?</h2>
    <br>
    <h3>It just works.</h3>
    <div class="chapter">
        <img src="images/data-diagram.webp" alt="Data Diagram">
        <p>
            <b>The Gist Of It</b><br>
            Urban Vein uses open data to estimate material compositions for the majority of its buildings. Machine learning models analyze building age, size, and use to identify material archetypes, leveraging reference data where exact information is unavailable. These material archetypes inform a dynamic D3.js-based visualization that overlays five material layers.
            This computational workflow affords granular insights into urban material trends. It enables seamless user interaction with layered data, offering toggles, hover functions, and future timeline animations. These methods transform abstract data into tangible actions to aid contextualizing material flows.
        </p>
    </div>
    <blockquote>
        All things are related, but nearby things are more related than distant things. - Walter Tobler, First Law of Geography.
    </blockquote>
    <div class="chapter">
        <p>
            <b>Machine Learning & Building Archetypes</b><br>
            Since I'm trying to use "archetypes" for training the ML model and populating the rest of the data with them, what buildings can represent NYC? What parameters should I take for most accurate material estimations?<br>
            archetypes here. different material profiles.<br>
            Random forest model.<br>
            ▘quantitative classification<br>
            this map uses individual quantile classifications for each material instead of a universal one. this decision is based on several key considerations:
            <br>
            ▘data precision and integrity<br>
            the dataset is based on approximations and educated estimates rather than precise measurements. as such, it is essential to avoid creating over-confident visual representations that could imply a level of accuracy that the data does not possess.
            <br>
            ▘material weight differences<br>
            different materials, such as steel, concrete, or brick, have vastly different densities. these differences make it inaccurate to compare the values of one material to another using a universal bin. a direct comparison between materials could distort the understanding of their distribution, as the weight and volume of each material influence its presence in the dataset.
            instead, by using separate bins for each material, each material’s distribution is evaluated within its own context. this method allows for a comparison of a single material against its own distribution (color,) ensuring that variations in material properties do not skew the analysis.
            <br>
            ▘enabling meaningful comparison<br>
            the use of individual bins allows for a more granular comparison of material distributions. for instance, when comparing a specific region's material composition to that of the entire city of new york, the data reflects the characteristics of each material while still situating it in the context of the broader landscape.
        </p>
    </div>
    <blockquote>
        Spatial data science has the unique ability to predict future occurrences based on past data. - Shashi Shikhar and Pamela Vold, Spatial Data, and Spatial Data Science, in Spatial Computing, MIT Press, 2019, pp 127-197
    </blockquote>
    <div class="chapter">
        <p>
            <b>How To Visualize Multiple Layers On A Single Canvas?</b><br>
            visualization archive. inspos. one of the key challenges of this project was to develop a clear and effective visual style for overlaying multiple layers of material information onto a single map. the goal was to ensure that users could easily distinguish and interact with each layer. the visualization process was mainly conducted in qgis, culminating in a web presentation format using d3.js.
        </p>
    </div>
    <div class="chapter">
        <p>
            <b>Cleaning Up Geojsons</b><br>
            QGIS and the python splitter. two data layers.
        </p>
    </div>
    <div class="chapter">
        <p>
            <b>Interactivity</b><br>
            Civilization and Rimworld. get some quotes from the creator (Tynan)? cahrt funciton. x-ray function. <br>
            <b>Hover details</b><br>
            I started Urban Vein wanting to make a map space with minimal ui. In the earlier phases, ... Always view the tile info on hover.
            <br>
            <b>Chart.js</b><br>
            ssadf Rose chart.
            <br>
            <b>Google Street View API</b><br>
            on click. can be confusing because when you click on a tile, the street view often shows a single buliding or an interior, while the actual tile ususally consists of multiple, if not dozens of, buildings.
            <br>
            <b>X-ray</b><br>
            One thing I've always wanted to add in a map platform was a way to turn on a mask to see different layers. It'd be more spontaneous and flexible than a draggable mask bar to compare left and right, and less rigid than toggling layers and fiddling with their opacities. Although this method doesn't work as well on touchscreen devices, the x-ray function I've implemented here will allow users to freely compare different map tiles with the material layer. Essentially I'm adding another map space with different layers, and using an x-ray element to follow the cursor and sync the map to its position.
        </p>
    </div>
    <pre class="language-javascript"><code>
let xrayMask = document.getElementById("xray-mask");

// Track cursor movement AND adjust X-ray map position
document.addEventListener("mousemove", function (e) {
    xrayMask.style.left = `${e.pageX}px`;  // Position the mask (left)
    xrayMask.style.top = `${e.pageY}px`;  // Position the mask (top)
<br>
    // Adjust the X-ray map center dynamically
    xrayMap.setView(mainMap.containerPointToLatLng(mainMap.mouseEventToContainerPoint(e)), mainMap.getZoom());
});

// Sync X-ray map movement with main map movement
mainMap.on("move", function () {
    xrayMap.setView(mainMap.getCenter(), mainMap.getZoom());
});
    </code></pre>
    <div class="chapter">
        <p>
            <b>The Art of Subtraction</b><br>
            This is the part where I struggle the most and can be applied to my undergrad studies, my professional career, and for this project. It's always fascinating to see how my ambition, execution, and physical/mental capabilities balance out across all stages of design projects. This is the part where presentation takes hold and shifts the emphasis of Urban Vein.<br>
            In the previous chapters, I've added tons of features to support Urban Vein's core functions, and now is the time to go in the edit room and trim the project anew. In an earlier version of the website, (put img?) the left sidebar was visible on default.
        </p>
    </div>
    <blockquote>
        ghdf
    </blockquote>
</section>

<section id="chapter-who" class="chapter-section">
    <h2>Who's Behind Urban Vein?</h2>
    <br>
    <h3>
        Architect & First-time coder with help from a bunch of lovely GSAPP folks. (put a d3 class node as an image below)
    </h3>
    <div class="chapter">
        <p>
            Urban Vein is a project I developed during my <a href="https://www.arch.columbia.edu/programs/15-m-s-computational-design-practices">Master of Science in Computational Design Practices (M.S.CDP)</a> at Columbia University’s Graduate School of Architecture, Planning, and Preservation (GSAPP). The CDP program is structured around a three-semester core course—Colloquium I, II, and III—which serves as the foundation for developing a capstone project throughout the program.<br>
            Over the course of three semesters, I shaped Urban Vein from concept to execution. In the first semester, I focused on defining the project's core ideas, while the second and third semesters were dedicated to implementation and refinement. With this structure in mind, I intentionally selected electives that would support and enhance the project.<br>
            The electives that directly contributed to Urban Vein include, but are not limited to, the following (listed in semester and alphabetical order):
        </p>
    </div>
    <div class="chapter">
        <img src="" alt="D3 class diagram">
        <p>
            <b>Summer</b><br>
            Computational Design Workflows by Celeste Layne;<br>
            Computational Modeling by Meli Harvey and Luc Wilson;<br>
            Mapping Systems by Mario Giampieri; and<br>
            Methods As Practices by William Martin and Violet Whiteney.<br>
            <br>
            <b>Fall</b><br>
            Data Visualization For Architecture, Urbanism, and the Humainties by Jia Zhang;<br>
            Explore, Explain, Propose by Laura Kurgan and Snoweria Zhang; and<br>
            GIS For Design Practices by Dare Brawley and Mario Giampieri.<br>
            <br>
            <b>Spring</b><br>
            Design in Action by Catherine Griffiths and Seth Thompson;<br>
            Exploring Urban Data with Machine Learning by Jonathan Stiles;<br>
            Footprint: Carbon & Design by David Benjamin; and<br>
            Spatial Design Narratives by Josh Begley.<br>
            <br>
            The '25 class projects of the three semesters can be found here, here, and here.
        </p>
    </div>
</section>
<div style="display: flex; justify-content: center;">
    <button id=intro-exit-2>ACCESS URBAN VEIN</button>
</div>


<h3>▘visuals/interactivity</h3>
<p>
    <a href="https://climate-conflict.org/www/data-pages/hazards">climate-conflict-vulnerability index</a>
    <br>
    by <a href="https://truth-and-beauty.net/">moritz stefaner</a>
    <br><br>
    <a href="https://www.artic.edu/artworks/204516/atlas-of-the-new-dutch-water-defence-line">atlas of the new dutch water defence line</a>
    <br>
    by <a href="https://www.joostgrootens.nl/">joost grootens</a>
    <br><br>
    <a href="https://civilization.2k.com/">sid meier's civilization series</a>
    <br>
    by <a href="https://firaxis.com/">firaxis games</a>
    <br><br>
    <a href="https://rimworldgame.com/">rimworld</a>
    <br>
    by <a href="https://ludeon.com/blog/">ludeon studios</a>
    <br><br>
    <a href="https://www.marathonthegame.com/y3vmGPNRxH3RNTqLkq5PFXZy">marathon</a>
    <br>
    by <a href="https://www.bungie.net/7">bungie</a>
    <br><br>
    <a href="https://www.are.na/mario-giampieri/g4dp-f24-precedent-presentations">g4dp f24 precedent presentations</a>
    <br>
    are.na channel curated by the fall '24 gis for design practices group at gsapp columbia</a>
</p>
<h3>▘gis/mapping</h3>
<p>
    <a href="https://designpractices.org/">gis for design practices</a>
    <br>
    by dare brawley and mario giampieri
    <br><br>
    <a href="https://mappinghny.com/">mapping historical new york</a>
    <br>
    by <a href="https://c4sr.columbia.edu/">center for spatial research</a>
    <br><br>
    <a href="https://centerforspatialresearch.github.io/asianAmericans/">asian american dot density map</a><br>
    by jia zhang
    <br><br>
    <a href="https://www.nyc.gov/assets/buildings/html/dob-development-report-2022.html">nyc construction dashboard 2022</a>
    <br>
    by dob analytics
</p>
<h3>▘material estimation & circular economy</h3>
<p>
    <a href="https://onlinelibrary.wiley.com/doi/full/10.1111/jiec.13456">city-scale assessment of the material and environmental footprint of buildings using an advanced building information model: a case study from canberra, australia</a><br>
    by natthanij soonsawad, raymundo marcos-martinez, and heinz schandl
    <br><br>
    <a href="https://www.bamb2020.eu/wp-content/uploads/2019/02/bamb_materialspassports_bestpractice.pdf#page=54">materials passports - best practices</a>
    <br>
    by matthias heinrich and werner lang
    <br><br>
    <a href="https://www.sciencedirect.com/science/article/abs/pii/S2210670723000665">estimating the recoverable value of in-situ building materials</a><br>
    by aida mollaei, chris bachmann, and carl haas
    <br><br>
    <a href="https://www.rsmeans.com/">rsmeans data</a>
    <br>
    by <a href="https://www.gordian.com/">gordian</a>
    <br><br>
    <a href="https://www.circularise.com/industry/construction">circularise</a>
    <br>
    by <a href="https://www.circularise.com">circularise</a>
    <br><br>
    <a href="https://www.zillow.com/z/zestimate/">zestimate</a>
    <br>
    by <a href="https://www.zillow.com">zillow</a>
</p>
<h3>▘speculation</h3>
<p>
    <a href="https://www.oma.com/publications/roadmap-2050-a-practical-guide-to-a-prosperous-low-carbon-europe">roadmap 2050</a><br>
    by <a href="https://www.oma.com/">oma</a>
</p>
<h3>▘js libraries</h3>
<p>
    <a href="https://leafletjs.com/">leaflet</a><br>
    originally created by <a href="https://agafonkin.com/">volodymyr agafonkin</a>
    <br><br>
    <a href="https://github.com/Norkart/Leaflet-MiniMap">leaflet-minimap</a><br>
    originally created by <a href="https://www.robpvn.net/">robert nordan</a>
    <br><br>
    <a href="https://github.com/perliedman/leaflet-control-geocoder">leaflet control geocoder</a><br>
    originally created by <a href="https://www.liedman.net/">per liedman</a>
    <br><br>
    <a href="https://d3js.org/">d3</a><br>
    by <a href="https://bost.ocks.org/mike/">mike bostock</a> and <a href="https://observablehq.com/">observable, inc.</a>
    <br><br>
    <a href="https://github.com/mrcagney/geohexgrid">geohexgrid</a><br>
    by <a href="https://www.mrcagney.com/team/alex-raichev/">alex raichev</a> at <a href="https://www.mrcagney.com/">mrcagney</a>
    <br><br>
    <a href="https://www.chartjs.org/">chart</a><br>
    by <a href="https://github.com/etimberg">evert timberg</a> and <a href="https://github.com/chartjs/Chart.js/graphs/contributors">github contributors</a>
    <br><br>
    <a href="https://splidejs.com/">splide</a><br>
    by <a href="https://github.com/NaotoshiFujita">naotoshi fujita</a>
</p>
<h3>▘columbia gsapp m.s.cdp</h3>
<p>
    <a href="https://gsapp-cdp.github.io/archive/">capstone project archive</a>
</p>