# 嗨, Welcome to NYC Building Materials!
<p>
    I've always taken a fondness on how Karl Popper approaches science in terms of replication. Since <a href="https://www.arch.columbia.edu/programs/15-m-s-computational-design-practices">my masters program</a> resides in the "of sciences" realm, it makes sense to adhere to this line of thinking when producing and structuring the design:
</p>
<blockquote>
    We do not take even our own observations quite seriously, or accept them as scientific observations, until we have repeated and tested them. Only by such repetitions can we convince ourselves that we are not dealing with a mere isolated ‘coincidence,' but with events which, on account of their regularity and reproducibility, are in principle inter-subjectively testable.
</blockquote>
<p>
    With that in mind, this article is geared towards explaining how this project came to fruition and documenting it in a way that is clear and concise. 
</p>
<section id="chapter-what" class="chapter-section">
    <h2>What is NYC Building Materials?</h2>
    <br>
    <h3>A computational "census" for buliding materials.</h3>
    <div class="subchapter">
        <p>
            <b>An Old Fascination</b>
            <br><br>
            I’ve always been fascinated by old buildings. Watching them get torn down and replaced by glass towers made me wonder: how many materials are packed into these structures, and how can we begin to grasp the scale of it all through visualization? How can we reintroduce ourselves to our built environment all through a material lens? That curiosity led me to the idea of building a platform where people could explore this question through interactive layers. It is about creating a holistic, interactive map of building material footprints—something that makes visible what’s often overlooked, and invites everyone to think critically about what we’re building, and what we’re losing.
        </p>
        <img class="image-full" src="articles/images/concept-diagram.png" alt="Concept">
        <div class="image-figure">
        The three stages of my project workflow.
        </div>
    </div>
    <div class="subchapter">
        <p>
            <b>Strategy Games and Shower Thoughts</b>
            <br><br>
            Since this is a personal project, it’s only natural that my own interests would find their way in. I’m an avid gamer—the kind with thousands of hours logged on Steam alone. As someone who’s spent a lot of time playing RimWorld and the Civilization series, I kept thinking about how those games communicate complex systems through intuitive tile-based layouts. What if I could "borrow" these designs and utilize them in my architectural projects? What if these interactive designs could lend to more communitive projects? These evening hours role-playing historical figures and AI overseers eventually became a key influence for how I approach the data structure, visualization methods, and UI for a lot of projects.
        </p>
        <img class="image-full" src="articles/images/game_civilization.jpg" alt="Civilization">
        <div class="image-figure">
        In Civilization, each tile has different attributes affecting movement, production output, and even building availability.<br>
        Screenshot courtesy of Firaxis Games / 2K Games. Source: <a href="https://store.steampowered.com/app/289070/Sid_Meiers_Civilization_VI/">Steam</a>.
        </div>
        <img class="image-full" src="articles/images/game_rimworld.jpg" alt="Civilization">
        <div class="image-figure">
        In RimWorld, each playerbase is subjected to a tile's temperature, rainfall, terrain, and other natural/artificial factors.<br>
        Screenshot courtesy of Ludeon Studios. Source: <a href="https://store.steampowered.com/app/294100/RimWorld/">Steam</a>.
        </div>
    </div>
    <blockquote>
        The basic proposition employed is that any place is the sum of historical, physical and biological processes, that these are dynamic, that they constitute social values, that each area has an intrinsic suitability for certain land uses and finally, that certain areas lend themselves to multiple coexisting land uses. - McHarg, I., 1970. Processes as Values, in Design with Nature. Wiley, New York, pp. 102–115.
    </blockquote>
</section>

<section id="chapter-why" class="chapter-section">
    <h2>Why Is This Important?</h2>
    <br>
    <h3>Another Window to Our Built Environment.</h3>
    <div class="subchapter">
        <p>
            <b>Urbex in Taichung</b>
            <br><br>
            I like to think this project actually started back in 2019, when I was doing field research for my undergrad thesis. It focused on an abandoned theater complex in Taichung’s old entertainment hub—the Central District. It was bulit in 1954 and was abandoned in 2003 during the Taiwan SARS pandemic. The building was ten stories tall, now completely empty except for the basement, which had been converted into a parking rental for the neighborhood. I ended up talking my way in—playing my student card with the security guard to get 30 minutes inside. I wandered the whole building, floor by floor, from the basement to the rooftop.
        </p>
        <div style="display: flex; justify-content: center;">
            <img class="image-narrow" src="articles/images/taichung-diagram.png" alt="Building diagram" style="margin-bottom: 15px;">
        </div>
        <div class="image-figure">
        A section of Tunghai Theater, or 東海戲院 in Mandarin.
        </div>
        <p>
            Urban exploration—or Urbex, as some of us call it—is an emotionlly intense experience. Your senses sharpen because of the secrecy (or semi-secrecy, in my case), and you notice so much more than you would in a normal setting. It feels like stepping into an alternate reality where everything is still and silent, and you’re the only thing moving—slipping through layers of forgotten slices of life. The furniture was gone or trashed, fixtures torn out, and what remained were surfaces—tiles, textures, the bare bones of the hustle that once was. These were materials that couldn’t be salvaged, so they just sat there for a decade.
        </p>
        <img class="image-full" src="articles/images/taichung.png" alt="Building Interior">
        <div class="image-figure">
        The now emptied-out complex. Word of advice: don't go solo-urbexing.
        </div>
        <p>
            Now that the building has been demolished, taken apart and hauled away (in 2020, just one year after I graduated,) I feel an urge to tell a story. One about the identity of a city and how it’s shaped by its parts—its buildings. People come and go, interiors shift, and memories change, but the materials that linger hold a kind of silent presence. That deserves to be celebrated, and I knew, someday in the future, I'd have the opportunity to do so.
        </p>
    </div>
    <blockquote>
        We need more pluralism in design, not of style but of ideology and values. - Anthony Dunne and Fiona Raby: Speculate Everything, Chapter 1-3, pp.1-47.
    </blockquote>
    <div class="subchapter">
        <p>
            <b>Creating A Local Building Material Platform</b>
            <br><br>
            Fast foward six years later, I'm studying computational design in GSAPP Columbia. In my Colloquium class, there’s a reading I keep coming back to, mainly because of how the author frames local data as something shaped by dynamic, ongoing societal participation. Out of all the great readings in that class, that one really stuck with me:
            <blockquote>
                All data are local. Indeed, data are cultural artifacts created by people, and their dutiful machines, at a time, in a place, and with the instruments at hand for audiences that are conditioned to receive them. -Yanni Loukissas, “From Data Sets to Data Settings,” in All Data are Local
            </blockquote>
            This got me thinking: how can I take an instrument I know how to play and write a song that resonates—not just with an audience, but with myself? How can I create a platform that reveals how building materials shape the identity of our local environments? The challenge is, I don’t know the instrument yet. I’m an architect, and web development and coding are still very new to me. So where do I begin?
        </p>
    </div>
    <blockquote>
            If every building is both an addition and a subtraction, every act of unbuilding is also both a subtraction and an addition. - Easterling, Keller, “Subtraction”, 2003.
    </blockquote>
    <div class="subchapter">
        <p>
            <b>Where This Project Began</b>
            <br><br>
            One of my first projects in the M.S. CDP program was to build an interactive website that mapped out the broad strokes of my potential capstone. Gorilla Urbanism used layered masks to create an x-ray effect—revealing Manhattan’s building floor-area-ratios alongside their respective occupancies. Not bad for a first-time web dev, right? You can already sense something brewing here—something about usage, visibility, and x-ray ways of seeing the city.
        </p>
        <img class="image-full" src="articles/images/layout-00.gif" alt="Gorilla Urbanism">
        <div class="image-figure">
        A mock-up of what's to come in later semesters.
        </div>
        <p>
            In the Fall semester, I also made an attempt at documenting NYC's building age and demolition using data from NYC OpenData. A simple static map that shows the "birth, life, and death" of NYC buildings. Now it's more about lifecycles and materials.
        </p>
        <div class="image-full" style="display: flex; flex-direction: row;">
            <img  src="articles/images/layout-color-01.png" alt="NYC Building Age 01" style="width: 33%;">
            <img  src="articles/images/layout-color-02.png" alt="NYC Building Age 02" style="width: 33%;">
            <img  src="articles/images/layout-color-03.png" alt="NYC Building Age 03" style="width: 33%;">
        </div>
        <div class="image-figure">
        Class assignments for GIS for Design Practics by Dare Brawley and Mario Giampieri.
        </div>
        <p>
            Finally, during Colloquium II by Laura Kurgan and Snoweria Zhang, they showed a case study on how computational design could be utilized in AEC and adjacent industries: <a href="https://climate-conflict.org/www">Climate—Conflict—Vulnerability Index by Moritz Stefaner</a>. 
        </p>
        <img class="image-full" src="articles/images/case-ccvi.png" alt="CCVI">
        <div class="image-figure">
            A beautifully clean approach to visualizing multiple layers—using opacity and blending modes to evoke a chromatic aberration effect. One point of critique: the data integrity in certain regions, like Taiwan, raises questions—it's unlikely to have zero conflict hazard exposures. That said, even the strongest projects encounter data gaps. What stands out here is the thoughtful visualization, analytical clarity, and an awareness of the data’s limitations—hallmarks of a great project. 
        </div>
        <p>
            This project became the final push behind NYC Building Materials. I realized I could build a web platform that reintroduces users to New York City through a purely material lens: combining interactive tools like x-ray masks, GIS data analysis, and web-based visualization techniques. It'll invite users to engage with critical questions of sustainability and urban identity, presenting those data in an interactive, participatory manner.
        </p>
        <img class="image-full" src="articles/images/layout-final.png" alt="NYC Building Materials">
        <div class="image-figure">
            NYC Building Materials as of April 2025.
        </div>
    </div>
</section>

<section id="chapter-how" class="chapter-section">
    <h2>How Does It Work?</h2>
    <br>
    <h3>Open Data + Machine Learning + D3.JS + Coffee</h3>
    <div class="subchapter">
        <p>
            <b>Missing Data</b>
            <br><br>
            At its core, this project functions like a city-wide BIM model; looser in scope, but built for comparison and exploration. To make something like this work, I needed data. While NYC Open Data offers a wide range of public datasets, none mapped building materials at the lot* level. So, I decided to build that dataset myself.
            <br><br>
            *Lot (building lot): a plot of land designated for constructing a building, often a house or other structure.
        </p>
        <img class="image-full" src="articles/images/data-structure.png" alt="Data Structure">
        <div class="image-figure">
        An overview of the data processing and visualization structure.
        </div>
    </div>
    <div class="subchapter">
        <p>
            <b>Part 1 of 4: Using K-Prototype to Cluster Buildings And Assigning Material Profiles with Educated Estimations</b>
            <br><br>
            To estimate building materials across NYC, I first needed to cluster buildings by type. This step helps define the range of building typologies before assigning material compositions using external datasets. While it's possible to categorize buildings directly using PLUTO data, such as age, use type, land use, and ownership, clustering provides a more holistic view of the city's building landscape that also helps prioritize which clusters to flesh out in more detail for accurate material estimation.<br>
            By using Python's scikit-learn K-Prototype clustering, NYC buildings could be defined in six clusters, and their general characteristics are as follows:<br>
            1. One- and Two-Family Residential Homes (70.64%)<br>
            The vast majority of buildings in this category are located in residential zones, primarily constructed between the 1920s and 1960s. These low-rise homes make up over 70% of the building stock, reflecting suburban-style developments across the outer boroughs.
            <br>
            2. Multi-Family Elevator and Mixed Residential-Commercial Buildings (16.33%)<br>
            Found mainly in residential zones, these structures blend residential units with ground-floor retail or community use, and most were built between 1910 and 1930.
            <br>
            3. Commercial and Office Buildings (7.53%)<br>
            Concentrated in commercial zones, these mid-20th-century buildings—dating from roughly 1925 to 1970, representing a mix of retail corridors, office blocks, and business centers.
            <br>
            4. Multi-Family Walk-Up Apartments (2.61%)<br>
            These buildings, lacking elevators and generally rising three to five stories, are a staple of older residential neighborhoods built between 1910 and 1960.
            <br>
            5. Industrial and Manufacturing Facilities (1.58%)<br>
            Located in industrial zones, these buildings were largely constructed between 1930 and 1970. They speak to NYC’s industrial past, now often adapted for creative or logistical uses.
            <br>
            6. Public Facilities and Institutional Buildings (1.31%)<br>
            Schools, churches, libraries, and other civic structures make up this final category. Though placed within residential zones, their functions stand apart. Most were built between 1925 and 1965, during periods of public infrastructure expansion.
            <br>
        </p>
        <div class="image-full" style="display: flex; flex-direction: column">
            <img src="articles/images/comparison-01.png" alt="Comparison-Queens" style="margin-bottom: 5px">
            <img src="articles/images/comparison-02.png" alt="Comparison-Brooklyn">
        </div>
        <div class="image-figure">
            A comparison between estimating building data with and without clustering first. The top figure highlights a section of Queens; the bottom, Brooklyn.
        </div>
        <p>
            For the next step, I’m combining the Regional Assessment of buildings’ Material Intensities (RASMI) by Tomer Fishman et al.—a dataset that blends empirical material studies with synthetic estimates expanded through a random forest model—with my own building clusters. Each cluster is then further divided by building age, borough, height, ownership, and use type to define more precise material profiles. The result is a custom dataset that assigns estimated quantities of timber, glass, concrete, masonry, and steel to every land lot in the city, effectively creating BIM-like data for the entire built environment of NYC.
        </p>
    </div>
    <blockquote>
        All things are related, but nearby things are more related than distant things. - Walter Tobler, First Law of Geography.
    </blockquote>
    <div class="subchapter">
        <p>
            <b>Part 2 of 4: Visualizing Material Data</b>
            <br><br>
            Now that I had the data, the next step was figuring out how to visualize all five materials on a single map. One of my main goals was to make sure users could clearly distinguish and interact with each material layer. At first, I experimented with heatmaps and dot density maps, taking cues from Jia Zhang’s excellent <a href="https://centerforspatialresearch.github.io/asianAmericans/">Asian American Dot Density Map</a>,but they didn’t quite translate, either contextually or visually, for mapping building materials.
        </p>
        <img class="image-full" src="articles/images/viz-history-1.png" alt="Visualization History">
        <div class="image-figure">
            The first phase of visualization experiments in QGIS included heatmaps, dot-density maps, and grid-based approaches.
        </div>
        <p>
            Then, I remembered how Civilization uses hex grids for both gameplay and visualization (old habits die hard,) especially its adjacency mechanics, both on a gameplay and theoretical level. Wanting to emphasize a purely material lens for NYC, and to move away from the rigidity of gridiron layouts from common map visualizations, I settled on a hexagon grid with overlapping dots as the core visual language for this project.
        </p>
        <img class="image-full" src="articles/images/viz-history-2.png" alt="Visualization History">
        <div class="image-figure">
            The second phase of visualization experiments in QGIS, ranging from single-color and two-tone maps to five-color palettes and finally a chromatic aberration effect.
        </div>
    </div>
    <div class="subchapter">
        <p>
            <b>Part 3 of 4: Platform Interactions</b>
            <br><br>
            Earlier, I mentioned how strategy games influenced this project (by now, it’s probably clear I’m really a huge gamer.) Two UI features that really stood out to me were X-ray views—layer toggles that follow your cursor with a mask—and info panels, which dynamically update based on what feature you’re hovering over. These tools make it easy to compare layers and tiles at a glance, and I wanted to bring that same sense of clarity and interactivity into this platform.
        </p>
        <img class="image-full" src="articles/images/demo-hover.gif" alt="Early UI">
        <div class="image-figure">
        An early iteration of the hover interaction featured a rose chart using Chart.js to visualize tile details. The design was ultimately scrapped and replaced with a five-dot visualization, as the rose chart’s shape made it difficult for users to intuitively connect the data with the map's dotted visuals.
        </div>
        <img class="image-full" src="articles/images/demo-xray.gif" alt="Early UI">
        <div class="image-figure">
        An early iteration of the x-ray function, which used separate Leaflet maps instead of map panes within the same map, hence the slight lag in performance.
        </div>
    </div>
    <div class="subchapter">
        <p>
            <b>Part 4 of 4: Story Markers</b>
            <br><br>
            During playtesting, one piece of feedback stood out: users weren’t always sure what the platform was trying to communicate. It lacked enough context and didn’t clearly convey its purpose. That led me to develop a system of ‘story markers’—small, material-themed monikers that feature quotes from The New York Times, tied to the material history of specific regions. These markers reveal their names, backstories, and references on hover, adding a layer of narrative and discovery. They help users explore the distribution of materials and understand the why and how behind them, essentially telling NYC’s story through the lens of what it’s made of.
        </p>
        <img class="image-full" src="articles/images/markers.gif" alt="Marker Study">
        <div class="image-figure">
        The markers also change appearance after being viewed, adding a sense of progression and discovery—like uncovering clues in a city-wide investigation. It brings a bit of exploration flair to the platform, encouraging users to dive deeper.
        </div>
        <img class="image-full" src="articles/images/markers.png" alt="Marker Study">
        <div class="image-figure">
        An early Illustrator study of distributing the markers. One of the guiding principles in assigning POI markers was to avoid selections based on mass media visibility or digital prominence. Instead, emphasis was placed solely on the visual interest of each material’s spatial distribution.
        </div>
    </div>
    <div class="subchapter">
        <p>
            <b>Extra Findings Along the Way: NYC Buildings Are Short and Old</b>
            <br><br>
            While analyzing the PLUTO dataset, I discovered that the majority of NYC’s buildings—by sheer count—are timber residentials built before 1940. It’s a striking contrast to the steel-and-glass city often portrayed in media, which really only captures a sliver of Manhattan. The reality is that NYC’s built environment is far more nuanced, with a rich variety of building types and materials spread across the five boroughs. That’s one of the key takeaways I had while building this material platform—and I hope you’ll uncover a few surprising insights of your own as you explore its features.
        </p>
        <img class="image-full" src="https://upload.wikimedia.org/wikipedia/commons/a/a5/West_side_of_Manhattan_from_Hudson_Commons_%2895103p%29.jpg" alt="NYC Tall & New">
        <div class="image-figure">
            The tall and the new.<br>
            Midtown Mantattan by <a href="//commons.wikimedia.org/wiki/User:Rhododendrites" title="User:Rhododendrites">Rhododendrites</a> - <span class="int-own-work" lang="en">Own work</span>, <a href="https://creativecommons.org/licenses/by-sa/4.0" title="Creative Commons Attribution-Share Alike 4.0">CC BY-SA 4.0</a>, <a href="https://commons.wikimedia.org/w/index.php?curid=83241407">Link</a>
        </div>
        <img class="image-full" src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Queens_aerial_2021.jpg" alt="NYC Short & Old">
        <div class="image-figure">
            The short and the old.<br>
            Aerial view of Queens by <a href="//commons.wikimedia.org/wiki/User:Antony-22" title="User:Antony-22">Antony-22</a> - <span class="int-own-work" lang="en">Own work</span>, <a href="https://creativecommons.org/licenses/by-sa/4.0" title="Creative Commons Attribution-Share Alike 4.0">CC BY-SA 4.0</a>, <a href="https://commons.wikimedia.org/w/index.php?curid=107221507">Link</a>
        </div>
        <div id="mainMap-layers-diagram">
            <div id="mainMap-layers-diagram-text">
                <div style="font-size: 0.9rem; margin-bottom: 10px; font-weight: 600; display: flex; flex-direction: row; align-items: center;">
                    <div class="mainMap-toggle-container">
                        <input type="checkbox" id="toggleMap" class="mainMap-toggle-input">
                        <label id="mainMap-toggle-short" for="toggleMap">SHORT</label>
                        <label for="toggleMap" class="mainMap-toggle-label"></label>
                        <label id="mainMap-toggle-old" for="toggleMap">OLD</label>
                    </div>
                </div>
                <div id="mainMap-layers-diagram-legend">
                    <div id="mainMap-layers-diagram-legendA"></div>
                    Building Count
                </div>
                <p>
                    Over <b>75%</b> of the city's buildings are <b>two stories or less</b>,<br> and more than <b>50%</b> were built <b>before 1940</b>. 
                </p>
                <div id="mainMap-layers-diagram-legend">
                    <div id="mainMap-layers-diagram-legendB"></div>
                    <div id="mainMap-layers-diagram-legendC"></div>
                    <div id="mainMap-layers-diagram-legendD"></div>
                    <div id="mainMap-layers-diagram-legendE"></div>
                    <div id="mainMap-layers-diagram-legendF"></div>
                    Building Material Weight
                </div>
                <p>
                    Over <b>50%</b> of the materials come from <b>two or fewer story buildings</b>, nearly <b>70%</b> of which are from buildings built <b>before 1940</b>. 
                </p>
            </div>
            <canvas id="numFloorsChart" height="250"></canvas>
        </div>
    </div>
    <blockquote>
        Spatial data science has the unique ability to predict future occurrences based on past data. - Shashi Shikhar and Pamela Vold, Spatial Data, and Spatial Data Science, in Spatial Computing, MIT Press, 2019, pp 127-197
    </blockquote>
</section>

<section id="chapter-who" class="chapter-section">
    <h2>Who's Behind NYC Building Materials?</h2>
    <br>
    <h3>
        Architect & First-time coder with help from a bunch of lovely GSAPP folks.
    </h3>
    <div class="subchapter">
        <p>
            <b>A Three-Semester Support</b>
            <br><br>
            I'm <a href="https://halfward.github.io/haoLee/">Hao Lee</a>, a licensed Taiwanese architect, artist, translator, film enthusiast, and heavy gamer. NYC Building Materials is a project I developed during my <a href="https://www.arch.columbia.edu/programs/15-m-s-computational-design-practices">Master of Science in Computational Design Practices (M.S.CDP)</a> at Columbia University’s Graduate School of Architecture, Planning, and Preservation (GSAPP). The CDP program is structured around a three-semester core course—Colloquium I, II, and III—which serves as the foundation for developing a capstone project throughout the program.
            <br>
            Over the course of three semesters, I shaped NYC Building Materials from concept to execution. In the first semester, I focused on defining the project's core ideas, while the second and third semesters were dedicated to implementation and refinement. With this structure in mind, I intentionally selected electives that would support and enhance the project.
            <br>
            The electives that directly contributed to NYC Building Materials include, but are not limited to, the following (listed in semester and alphabetical order):
        </p>
    </div>
    <div class="subchapter">
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
            The '25 class projects of the three semesters can be found <a href="https://gsapp-cdp.github.io/colloquium-1-2024/">here</a>, <a href="https://gsapp-cdp.github.io/colloquium-2-2024/">here</a>, and <a href="https://gsapp-cdp.github.io/colloquium-3-2024/">here</a>.
        </p>
    </div>
    <div class="subchapter">
        <p>
            <b>References</b>
            <br><br>
            <p>
                <b>Visuals/Interactivity</b><br>
                <a href="https://climate-conflict.org/www/data-pages/hazards">Climate-Conflict Vulnerability Index</a> by <a href="https://truth-and-beauty.net/">Moritz Stefaner</a>
                <br>
                <a href="https://www.artic.edu/artworks/204516/atlas-of-the-new-dutch-water-defence-line">Atlas of the New Dutch Water Defence Line</a>
                by <a href="https://www.joostgrootens.nl/">Joost Grootens</a>
                <br>
                <a href="https://civilization.2k.com/">Sid Meier's Civilization Series</a>
                <br>
                by <a href="https://firaxis.com/">Firaxis Games</a>
                <br>
                <a href="https://rimworldgame.com/">RimWorld</a>
                by <a href="https://ludeon.com/blog/">Ludeon Studios</a>
                <br>
                <a href="https://www.marathonthegame.com/y3vmGPNRxH3RNTqLkq5PFXZy">Marathon</a>
                by <a href="https://www.bungie.net/7">Bungie</a>
                <br>
                <a href="https://www.are.na/mario-giampieri/g4dp-f24-precedent-presentations">G4DP F24 Precedent Presentations</a>
                are.na channel curated by the Fall '24 GIS for Design Practices group at GSAPP Columbia</a>
            </p>
            <p>
                <b>GIS/Mapping</b><br>
                <a href="https://designpractices.org/">GIS for Design Practices</a> 
                by Dare Brawley and Mario Giampieri
                <br>
                <a href="https://mappinghny.com/">Mapping Historical New York</a>
                by <a href="https://c4sr.columbia.edu/">Center for Spatial Research</a>
                <br>
                <a href="https://centerforspatialresearch.github.io/asianAmericans/">Asian American Dot Density Map</a>
                by Jia Zhang
                <br>
                <a href="https://www.nyc.gov/assets/buildings/html/dob-development-report-2022.html">NYC Construction Dashboard 2022</a>
                by DOB Analytics
            </p>
            <p>
                <b>Material Estimation & Circular Economy</b><br>
                <a href="https://onlinelibrary.wiley.com/doi/full/10.1111/jiec.13456">City-Scale Assessment of the Material and Environmental Footprint of Buildings Using an Advanced Building Information Model: A Case Study from Canberra, Australia</a>
                by Natthanij Soonsawad, Raymundo Marcos-Martinez, and Heinz Schandl
                <br>
                <a href="https://www.bamb2020.eu/wp-content/uploads/2019/02/bamb_materialspassports_bestpractice.pdf#page=54">Materials Passports - Best Practices</a>
                by Matthias Heinrich and Werner Lang
                <br>
                <a href="https://www.sciencedirect.com/science/article/abs/pii/S2210670723000665">Estimating the Recoverable Value of In-Situ Building Materials</a>
                by Aida Mollaei, Chris Bachmann, and Carl Haas
                <br>
                <a href="https://www.rsmeans.com/">RSMeans Data</a>
                by <a href="https://www.gordian.com/">Gordian</a>
                <br>
                <a href="https://www.circularise.com/industry/construction">Circularise</a>
                by <a href="https://www.circularise.com">Circularise</a>
                <br>
                <a href="https://www.zillow.com/z/zestimate/">Zestimate</a>
                by <a href="https://www.zillow.com">Zillow</a>
            </p>
            <p>
                <b>Speculation</b><br>
                <a href="https://www.oma.com/publications/roadmap-2050-a-practical-guide-to-a-prosperous-low-carbon-europe">Roadmap 2050</a>
                by <a href="https://www.oma.com/">OMA</a>
            </p>
            <p>
                <b>JavaScript Libraries</b><br>
                <a href="https://leafletjs.com/">Leaflet</a>
                originally created by <a href="https://agafonkin.com/">Volodymyr Agafonkin</a>
                <br>
                <a href="https://github.com/Norkart/Leaflet-MiniMap">Leaflet-MiniMap</a>
                originally created by <a href="https://www.robpvn.net/">Robert Nordan</a>
                <br>
                <a href="https://github.com/perliedman/leaflet-control-geocoder">Leaflet-Control-Geocoder</a>
                originally created by <a href="https://www.liedman.net/">Per Liedman</a>
                <br>
                <a href="https://d3js.org/">D3</a>
                by <a href="https://bost.ocks.org/mike/">Mike Bostock</a> and <a href="https://observablehq.com/">Observable, Inc.</a>
                <br>
                <a href="https://github.com/mrcagney/geohexgrid">GeoHexGrid</a>
                by <a href="https://www.mrcagney.com/team/alex-raichev/">Alex Raichev</a> at <a href="https://www.mrcagney.com/">MRCagney</a>
                <br>
                <a href="https://www.chartjs.org/">Chart</a>
                by <a href="https://github.com/etimberg">Evert Timberg</a> and <a href="https://github.com/chartjs/Chart.js/graphs/contributors">GitHub Contributors</a>
                <br>
                <a href="https://splidejs.com/">Splide</a>
                by <a href="https://github.com/NaotoshiFujita">Naotoshi Fujita</a>
            </p>
            <p>
                <b>Columbia GSAPP M.S.Computational Design Practices</b><br>
                <a href="https://gsapp-cdp.github.io/archive/">Capstone Project Archive</a>
            </p>
        </p>
    </div>
</section>

<p style="margin-bottom: 50px; padding: 25px; font-style: italic;">
    Most, if not all, of this project is built on open data. Without the availability of pre-existing data and online documentation, at least 95% of my development time would have been spent on field research alone. While field research is invaluable, relying solely on it would limit the possibilities of creating a comprehensive computational project within just three semesters at Columbia. To me, one of the greatest strengths of America’s scientific community is its commitment to transparency and the willingness to investigate and document data. This openness to sharing information has not only fueled scientific and creative breakthroughs but also played a crucial role in uncovering and combating social injustices and inequalities. With NYC Building Materials, I aim to honor the government bodies, non-profits, academics, and individuals who contribute to this vital data-sharing ecosystem. It is through their dedication to open data that we can drive progress and stability.
</p>