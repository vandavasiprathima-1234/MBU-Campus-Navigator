// ============================================================
// CAMPUS HORIZON - MAP ENGINE
// Mohan Babu University, Tirupati
// Leaflet + MBU Campus Graph + Real-Time GPS Navigation
// ============================================================
import { campusPaths } from "./campusPaths.js";
export class MapEngine {

    constructor(elementId) {

        // ========================================================
        // MAP
        // ========================================================

        this.map = L.map(elementId).setView(
            [13.62372638586813, 79.29125030953361],
            17
        );

        // ========================================================
        // MAP LAYERS
        // ========================================================

        this.standardLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 20,
                attribution: "© OpenStreetMap"
            }
        ).addTo(this.map);

        this.satelliteLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                maxZoom: 20,
                attribution: "Tiles © Esri"
            }
        );

        L.control.layers({
            "Street Map": this.standardLayer,
            "Satellite": this.satelliteLayer
        }).addTo(this.map);

        // ========================================================
        // MAP GROUPS
        // ========================================================

        this.pathLayer =
            L.layerGroup().addTo(this.map);

        this.routeMarkerLayer =
            L.layerGroup().addTo(this.map);

        this.campusMarkerLayer =
            L.layerGroup().addTo(this.map);

        // ========================================================
// GOOGLE EARTH CAMPUS PATHS
// ========================================================

this.campusPathLayer = L.layerGroup().addTo(this.map);

this.drawCampusPaths();    

        // ========================================================
        // GPS
        // ========================================================

        this.gpsMarker = null;

        this.gpsAccuracyCircle = null;

        this.gpsWatchId = null;

        this.lastGPSPosition = null;

        // ========================================================
        // REAL-TIME NAVIGATION
        // ========================================================

        this.navigationMarker = null;

        this.navigationActive = false;

        this.campusNavigationActive = true;

        this.previousGPSPosition = null;

        this.currentHeading = 0;

        this.navigationDestination = null;

        this.navigationRouteCoordinates = [];

        // ========================================================
        // OLD ANIMATION VARIABLES
        // KEPT ONLY FOR COMPATIBILITY
        // ========================================================

        this.movingPersonMarker = null;

        this.routeAnimationFrame = null;

        // ========================================================
        // CAMPUS GRAPH
        // ========================================================

        this.campusGraph = {

            nodes: {

                // ==================================================
                // MAIN GATE
                // ==================================================

                node_main_gate_checkpoint: {
                    id: "node_main_gate_checkpoint",
                    name: "MBU Main Gate",
                    lat: 13.62372638586813,
                    lng: 79.29125030953361,
                    type: "gate",
                    tags: [
                        "main gate",
                        "entrance",
                        "security"
                    ],
                    meta: {
                        floor: 0,
                        building: "Main Gate"
                    }
                },

                // ==================================================
                // SMALL GATE
                // ==================================================

                node_small_gate: {
                    id: "node_small_gate",
                    name: "MBU Small Gate",
                    lat: 13.62358119291271,
                    lng: 79.28953690005571,
                    type: "gate",
                    tags: [
                        "small gate",
                        "entrance",
                        "pedestrian"
                    ],
                    meta: {
                        floor: 0,
                        building: "Small Gate"
                    }
                },

                node_pedestrian_side_gate: {
                    id: "node_pedestrian_side_gate",
                    name: "MBU Pedestrian Side Gate",
                    lat: 13.62358119291271,
                    lng: 79.28953690005571,
                    type: "gate",
                    tags: [
                        "pedestrian",
                        "side gate"
                    ],
                    meta: {
                        floor: 0,
                        building: "Small Gate"
                    }
                },

                // ==================================================
                // SAI BABA GATE
                // ==================================================

                node_sai_baba_gate: {
                    id: "node_sai_baba_gate",
                    name: "Sai Baba Near Gate",
                    lat: 13.62222015987198,
                    lng: 79.28904566798708,
                    type: "gate",
                    tags: [
                        "sai baba",
                        "gate",
                        "entrance"
                    ],
                    meta: {
                        floor: 0,
                        building: "Sai Baba Near Gate"
                    }
                },

                node_sai_temple_gate: {
                    id: "node_sai_temple_gate",
                    name: "MBU Sai Baba Temple Gate",
                    lat: 13.62222015987198,
                    lng: 79.28904566798708,
                    type: "gate",
                    tags: [
                        "temple",
                        "gate"
                    ],
                    meta: {
                        floor: 0,
                        building: "Sai Baba Near Gate"
                    }
                },

                // ==================================================
                // VALAMAR OFFICE
                // ==================================================

                node_valmar_office: {
                    id: "node_valmar_office",
                    name: "Valamar Office",
                    lat: 13.622557761550,
                    lng: 79.289435969819,
                    type: "building",
                    tags: [
                        "valamar",
                        "office"
                    ],
                    meta: {
                        floor: 0,
                        building: "Valamar Office",
                        source: "Google Earth KML"
                    }
                },

                node_valmar_east_road: {
                    id: "node_valmar_east_road",
                    name: "Valamar Office East Approach",
                    lat: 13.622557761550,
                    lng: 79.289435969819,
                    type: "intersection",
                    tags: [
                        "valamar",
                        "road"
                    ],
                    meta: {
                        floor: 0,
                        building: "Valamar Office"
                    }
                },

                // ==================================================
                // LIBRARY
                // ==================================================

                node_library: {
                    id: "node_library",
                    name: "Library",
                    lat: 13.622453392528,
                    lng: 79.289837233400,
                    type: "building",
                    tags: [
                        "library"
                    ],
                    meta: {
                        floor: 0,
                        building: "Library",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // MNS BLOCK
                // ==================================================

                node_mns_block: {
                    id: "node_mns_block",
                    name: "MNS Block",
                    lat: 13.621394264661,
                    lng: 79.289020499740,
                    type: "building",
                    tags: [
                        "mns",
                        "mns block"
                    ],
                    meta: {
                        floor: 0,
                        building: "MNS Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // PHARMACEUTICAL BLOCK
                // ==================================================

                node_pharmaceutical_block: {
                    id: "node_pharmaceutical_block",
                    name: "Pharmaceutical Block",
                    lat: 13.621911284076,
                    lng: 79.289368076277,
                    type: "building",
                    tags: [
                        "pharmacy",
                        "pharmaceutical"
                    ],
                    meta: {
                        floor: 0,
                        building: "Pharmaceutical Block",
                        source: "Google Earth KML"
                    }
                },

                node_pharmaceutical_entrance: {
                    id: "node_pharmaceutical_entrance",
                    name: "Pharmaceutical Block Entrance",
                    lat: 13.621911284076,
                    lng: 79.289368076277,
                    type: "entrance",
                    tags: [
                        "pharmacy",
                        "pharmaceutical",
                        "entrance"
                    ],
                    meta: {
                        floor: 0,
                        building: "Pharmaceutical Block"
                    }
                },

                // ==================================================
                // M BLOCK
                // ==================================================

                node_m_block_foyer: {
                    id: "node_m_block_foyer",
                    name: "M Block",
                    lat: 13.621827491851,
                    lng: 79.290454998104,
                    type: "building",
                    tags: [
                        "m block",
                        "engineering"
                    ],
                    meta: {
                        floor: 0,
                        building: "M Block",
                        source: "Google Earth KML"
                    }
                },

                node_m_block_front_plaza: {
                    id: "node_m_block_front_plaza",
                    name: "M Block Front Plaza",
                    lat: 13.621827491851,
                    lng: 79.290454998104,
                    type: "landmark",
                    tags: [
                        "m block",
                        "plaza"
                    ],
                    meta: {
                        floor: 0,
                        building: "M Block"
                    }
                },

                // ==================================================
                // G BLOCK
                // ==================================================

                node_g_block: {
                    id: "node_g_block",
                    name: "G Block",
                    lat: 13.620507745412,
                    lng: 79.290480825471,
                    type: "building",
                    tags: [
                        "g block"
                    ],
                    meta: {
                        floor: 0,
                        building: "G Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // UNIFORM BLOCK
                // ==================================================

                node_uniform_block: {
                    id: "node_uniform_block",
                    name: "Uniform Block",
                    lat: 13.619699825424,
                    lng: 79.291162778546,
                    type: "building",
                    tags: [
                        "uniform",
                        "uniform block"
                    ],
                    meta: {
                        floor: 0,
                        building: "Uniform Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // DEGREE BLOCK
                // ==================================================

                node_degree_block: {
                    id: "node_degree_block",
                    name: "Degree Block",
                    lat: 13.620028289878,
                    lng: 79.289605761629,
                    type: "building",
                    tags: [
                        "degree block"
                    ],
                    meta: {
                        floor: 0,
                        building: "Degree Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // MECHANICAL BLOCK
                // ==================================================

                node_mechanical_block: {
                    id: "node_mechanical_block",
                    name: "Mechanical Block",
                    lat: 13.620418901447,
                    lng: 79.290012157659,
                    type: "building",
                    tags: [
                        "mechanical",
                        "mechanical block"
                    ],
                    meta: {
                        floor: 0,
                        building: "Mechanical Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // CIVIL BLOCK
                // ==================================================

                node_civil_block: {
                    id: "node_civil_block",
                    name: "Civil Block",
                    lat: 13.620482554120,
                    lng: 79.289283987838,
                    type: "building",
                    tags: [
                        "civil",
                        "civil block"
                    ],
                    meta: {
                        floor: 0,
                        building: "Civil Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // SOUTH BLOCK
                // ==================================================

                node_south_block: {
                    id: "node_south_block",
                    name: "South Block",
                    lat: 13.620968647025,
                    lng: 79.290306075745,
                    type: "building",
                    tags: [
                        "south block"
                    ],
                    meta: {
                        floor: 0,
                        building: "South Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // EAST BLOCK
                // ==================================================

                node_east_block: {
                    id: "node_east_block",
                    name: "East Block",
                    lat: 13.621527458177,
                    lng: 79.289927765844,
                    type: "building",
                    tags: [
                        "east block"
                    ],
                    meta: {
                        floor: 0,
                        building: "East Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // WEST BLOCK
                // ==================================================

                node_west_block: {
                    id: "node_west_block",
                    name: "West Block",
                    lat: 13.621471584485,
                    lng: 79.290906924752,
                    type: "building",
                    tags: [
                        "west block"
                    ],
                    meta: {
                        floor: 0,
                        building: "West Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // GYM
                // ==================================================

                node_gym: {
                    id: "node_gym",
                    name: "Gym",
                    lat: 13.621812171418,
                    lng: 79.291467869350,
                    type: "building",
                    tags: [
                        "gym",
                        "sports"
                    ],
                    meta: {
                        floor: 0,
                        building: "Gym",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // CANTEEN
                // ==================================================

                node_canteen: {
                    id: "node_canteen",
                    name: "Canteen",
                    lat: 13.623254946522,
                    lng: 79.289777151903,
                    type: "building",
                    tags: [
                        "canteen",
                        "cafeteria",
                        "food"
                    ],
                    meta: {
                        floor: 0,
                        building: "Canteen",
                        source: "Google Earth KML"
                    }
                },

                node_canteen_hub: {
                    id: "node_canteen_hub",
                    name: "Canteen Hub",
                    lat: 13.623254946522,
                    lng: 79.289777151903,
                    type: "landmark",
                    tags: [
                        "canteen"
                    ],
                    meta: {
                        floor: 0,
                        building: "Canteen"
                    }
                },

                // ==================================================
                // NEW BLOCK
                // ==================================================

                node_new_block: {
                    id: "node_new_block",
                    name: "New Block",
                    lat: 13.623103895909,
                    lng: 79.290280221904,
                    type: "building",
                    tags: [
                        "new block"
                    ],
                    meta: {
                        floor: 0,
                        building: "New Block",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // HOSTEL
                // ==================================================

                node_v_hostel_boys: {
                    id: "node_v_hostel_boys",
                    name: "V Hostel Boys",
                    lat: 13.621066114414,
                    lng: 79.294072223854,
                    type: "building",
                    tags: [
                        "hostel",
                        "boys hostel",
                        "v hostel"
                    ],
                    meta: {
                        floor: 0,
                        building: "V Hostel Boys",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // PARKING
                // ==================================================

                node_parking_area: {
                    id: "node_parking_area",
                    name: "Parking Area",
                    lat: 13.622674293179,
                    lng: 79.290903317690,
                    type: "parking",
                    tags: [
                        "parking",
                        "vehicle parking"
                    ],
                    meta: {
                        floor: 0,
                        building: "Parking Area",
                        source: "Google Earth KML"
                    }
                },

                // ==================================================
                // LOTUS PARK
                // ==================================================

                node_lotus_park_lawn: {
                    id: "node_lotus_park_lawn",
                    name: "Lotus Pond Front Park",
                    lat: 13.623500000000,
                    lng: 79.291050000000,
                    type: "landmark",
                    tags: [
                        "park",
                        "lotus pond",
                        "garden"
                    ],
                    meta: {
                        floor: 0,
                        building: "Exterior"
                    }
                }
            },

            // ======================================================
            // CAMPUS CONNECTIONS
            // ======================================================

            edges: [

                ["node_main_gate_checkpoint", "node_small_gate"],
                ["node_main_gate_checkpoint", "node_new_block"],
                ["node_main_gate_checkpoint", "node_parking_area"],

                ["node_small_gate", "node_canteen"],

                ["node_new_block", "node_canteen"],
                ["node_new_block", "node_m_block_foyer"],

                ["node_parking_area", "node_m_block_foyer"],

                ["node_canteen", "node_library"],
                ["node_canteen", "node_valmar_office"],

                ["node_library", "node_valmar_office"],
                ["node_library", "node_east_block"],
                ["node_library", "node_m_block_foyer"],

                ["node_east_block", "node_mns_block"],
                ["node_east_block", "node_m_block_foyer"],

                ["node_valmar_office", "node_pharmaceutical_block"],
                ["node_valmar_office", "node_sai_baba_gate"],

                ["node_sai_baba_gate", "node_pharmaceutical_block"],

                ["node_pharmaceutical_block", "node_mns_block"],
                ["node_pharmaceutical_block", "node_degree_block"],

                ["node_mns_block", "node_civil_block"],

                ["node_degree_block", "node_civil_block"],
                ["node_degree_block", "node_mechanical_block"],

                ["node_mechanical_block", "node_south_block"],

                ["node_south_block", "node_g_block"],

                ["node_g_block", "node_m_block_foyer"],
                ["node_g_block", "node_west_block"],

                ["node_west_block", "node_gym"],
                ["node_west_block", "node_uniform_block"],
                ["node_west_block", "node_parking_area"],
                ["node_west_block", "node_v_hostel_boys"],

                ["node_m_block_foyer", "node_west_block"],
                ["node_m_block_foyer", "node_library"],

                ["node_pharmaceutical_entrance",
                    "node_pharmaceutical_block"],

                ["node_canteen_hub",
                    "node_canteen"],

                ["node_valmar_east_road",
                    "node_valmar_office"],

                ["node_m_block_front_plaza",
                    "node_m_block_foyer"],

                ["node_pedestrian_side_gate",
                    "node_small_gate"],

                ["node_sai_temple_gate",
                    "node_sai_baba_gate"]
            ]
        };

        // ========================================================
        // CONVERT TO BIDIRECTIONAL GRAPH
        // ========================================================

        const originalEdges =
            this.campusGraph.edges;

        this.campusGraph.edges = [];

        originalEdges.forEach(
            ([from, to]) => {

                const fromNode =
                    this.campusGraph.nodes[from];

                const toNode =
                    this.campusGraph.nodes[to];

                if (!fromNode || !toNode) {
                    return;
                }

                const weight =
                    this.calculateDistance(
                        fromNode,
                        toNode
                    );

                this.campusGraph.edges.push({

                    from: from,

                    to: to,

                    weight: weight,

                    structuralSteps: false,

                    defaultCrowdDensity: 1
                });

                this.campusGraph.edges.push({

                    from: to,

                    to: from,

                    weight: weight,

                    structuralSteps: false,

                    defaultCrowdDensity: 1
                });
            }
        );

        // ========================================================
        // DRAW CAMPUS
        // ========================================================

        this.renderGraphNodes();

        this.addBuildingLabels();

        this.fitCampusBounds();

        setTimeout(() => {

            this.map.invalidateSize();

        }, 300);
    }


    // ============================================================
    // DISTANCE
    // ============================================================

    calculateDistance(
        nodeA,
        nodeB
    ) {

        const R = 6371000;

        const lat1 =
            nodeA.lat *
            Math.PI /
            180;

        const lat2 =
            nodeB.lat *
            Math.PI /
            180;

        const deltaLat =
            (
                nodeB.lat -
                nodeA.lat
            ) *
            Math.PI /
            180;

        const deltaLng =
            (
                nodeB.lng -
                nodeA.lng
            ) *
            Math.PI /
            180;

        const a =
            Math.sin(deltaLat / 2) ** 2 +

            Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLng / 2) ** 2;

        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return R * c;
    }


    // ============================================================
    // GET GRAPH
    // ============================================================

    getCampusGraph() {

        return this.campusGraph;
    }


    // ============================================================
    // RENDER GRAPH NODES
    // ============================================================

    renderGraphNodes() {

        this.campusMarkerLayer.clearLayers();

        const hiddenAliases = new Set([

            "node_pedestrian_side_gate",

            "node_sai_temple_gate",

            "node_valmar_east_road",

            "node_pharmaceutical_entrance",

            "node_canteen_hub",

            "node_m_block_front_plaza"
        ]);

        Object.values(
            this.campusGraph.nodes
        ).forEach(node => {

            if (
                hiddenAliases.has(node.id)
            ) {
                return;
            }

            const marker =
                L.circleMarker(
                    [
                        node.lat,
                        node.lng
                    ],
                    {
                        radius:
                            node.type === "building"
                                ? 6
                                : 5,

                        weight: 2,

                        opacity: 0.9,

                        fillOpacity: 0.7
                    }
                );

            marker.bindTooltip(
                node.name,
                {
                    direction: "top",
                    offset: [0, -5]
                }
            );

            marker.addTo(
                this.campusMarkerLayer
            );
        });
    }


    // ============================================================
    // BUILDING LABELS
    // ============================================================

    addBuildingLabels() {

        Object.values(
            this.campusGraph.nodes
        ).forEach(node => {

            if (
                node.type !== "building"
            ) {
                return;
            }

            const label =
                L.marker(
                    [
                        node.lat,
                        node.lng
                    ],
                    {
                        icon:
                            L.divIcon({

                                className:
                                    "campus-building-label",

                                html:
                                    `
                                    <div style="
                                        font-size:11px;
                                        font-weight:700;
                                        color:#0f172a;
                                        background:rgba(255,255,255,0.88);
                                        padding:3px 6px;
                                        border-radius:5px;
                                        border:1px solid #cbd5e1;
                                        white-space:nowrap;
                                        box-shadow:0 1px 4px rgba(0,0,0,0.15);
                                    ">
                                        ${node.name}
                                    </div>
                                    `,

                                iconSize:
                                    null,

                                iconAnchor:
                                    [0, 0]
                            })
                    }
                );

            label.addTo(
                this.campusMarkerLayer
            );
        });
    }


    // ============================================================
    // FIT CAMPUS
    // ============================================================

    fitCampusBounds() {

        const coordinates =
            Object.values(
                this.campusGraph.nodes
            )
            .filter(node =>
                Number.isFinite(node.lat) &&
                Number.isFinite(node.lng)
            )
            .map(node =>
                [
                    node.lat,
                    node.lng
                ]
            );

        if (!coordinates.length) {
            return;
        }

        this.map.fitBounds(
            L.latLngBounds(
                coordinates
            ),
            {
                padding: [
                    40,
                    40
                ]
            }
        );
    }


    // ============================================================
    // NEAREST NODE
    // ============================================================

    getNearestNode(
        latitude,
        longitude
    ) {

        let nearestNode = null;

        let smallestDistance =
            Infinity;

        Object.values(
            this.campusGraph.nodes
        ).forEach(node => {

            if (
                node.type === "restricted"
            ) {
                return;
            }

            const distance =
                this.calculateDistance(
                    {
                        lat:
                            latitude,

                        lng:
                            longitude
                    },

                    node
                );

            if (
                distance <
                smallestDistance
            ) {

                smallestDistance =
                    distance;

                nearestNode = {

                    ...node,

                    distanceMeters:
                        distance
                };
            }
        });

        return nearestNode;
    }


    // ============================================================
    // DRAW ROUTE
    // ============================================================

    drawPathLine(
        coordinates,
        startNode = null,
        targetNode = null
    ) {

        if (
            !coordinates ||
            coordinates.length < 2
        ) {
            return;
        }

        // --------------------------------------------------------
        // REMOVE OLD ROUTE
        // --------------------------------------------------------

        this.pathLayer.clearLayers();

        this.routeMarkerLayer.clearLayers();

        // --------------------------------------------------------
        // STOP OLD FAKE ANIMATION
        // --------------------------------------------------------

        this.stopRouteAnimation();

        // --------------------------------------------------------
        // STOP OLD LIVE NAVIGATION
        // --------------------------------------------------------

        this.stopLiveNavigation();


        // ========================================================
        // BLUE ROUTE
        // ========================================================


const routeLine = L.polyline(coordinates, {
    color: '#ff0000',
    weight: 8,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round'
}).addTo(this.pathLayer);

routeLine.bringToFront();
        // ========================================================
        // START MARKER
        // ========================================================

        if (startNode) {

            const startMarker =
                L.marker(
                    [
                        startNode.lat,
                        startNode.lng
                    ],
                    {
                        icon:
                            L.divIcon({

                                className:
                                    "route-start-marker",

                                html:
                                    `
                                    <div style="
                                        width:28px;
                                        height:28px;
                                        border-radius:50%;
                                        background:#16a34a;
                                        border:4px solid white;
                                        box-shadow:0 2px 8px rgba(0,0,0,.35);
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        color:white;
                                        font-size:12px;
                                        font-weight:bold;
                                    ">
                                        S
                                    </div>
                                    `,

                                iconSize:
                                    [28, 28],

                                iconAnchor:
                                    [14, 14]
                            })
                    }
                );

            startMarker.bindPopup(
                `<strong>START</strong><br>${startNode.name}`
            );

            startMarker.addTo(
                this.routeMarkerLayer
            );
        }


        // ========================================================
        // DESTINATION MARKER
        // ========================================================

        if (targetNode) {

            const destinationMarker =
                L.marker(
                    [
                        targetNode.lat,
                        targetNode.lng
                    ],
                    {
                        icon:
                            L.divIcon({

                                className:
                                    "route-destination-marker",

                                html:
                                    `
                                    <div style="
                                        width:30px;
                                        height:30px;
                                        border-radius:50%;
                                        background:#dc2626;
                                        border:4px solid white;
                                        box-shadow:0 2px 8px rgba(0,0,0,.35);
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        color:white;
                                        font-size:13px;
                                        font-weight:bold;
                                    ">
                                        D
                                    </div>
                                    `,

                                iconSize:
                                    [30, 30],

                                iconAnchor:
                                    [15, 15]
                            })
                    }
                );

            destinationMarker.bindPopup(
                `<strong>DESTINATION</strong><br>${targetNode.name}`
            );

            destinationMarker.addTo(
                this.routeMarkerLayer
            );
        }


        // ========================================================
        // FIT ROUTE
        // ========================================================

        this.map.fitBounds(
            L.latLngBounds(
                coordinates
            ),
            {
                padding:
                    [
                        70,
                        70
                    ]
            }
        );


        // ========================================================
        // SAVE ROUTE
        // ========================================================

        this.navigationRouteCoordinates =
            coordinates;

        this.navigationDestination =
            targetNode;

    
        // ========================================================
        // START REAL GPS
        // ========================================================

        this.startLiveNavigation();
    }


    // ============================================================
    // OLD ANIMATION DISABLED
    // ============================================================

    animatePersonAlongRoute() {

        // IMPORTANT:
        // We do NOT simulate movement anymore.
        //
        // Movement is controlled by real GPS.
        //
        // This function remains here so other code that calls
        // it will not produce an error.

        return;
    }


    // ============================================================
    // STOP OLD ANIMATION
    // ============================================================

    stopRouteAnimation() {

        if (
            this.routeAnimationFrame !== null
        ) {

            cancelAnimationFrame(
                this.routeAnimationFrame
            );

            this.routeAnimationFrame =
                null;
        }

        if (
            this.movingPersonMarker
        ) {

            this.map.removeLayer(
                this.movingPersonMarker
            );

            this.movingPersonMarker =
                null;
        }
    }


    // ============================================================
    // GPS MARKER
    // ============================================================

    updateGPSMarker(
        latitude,
        longitude,
        accuracy
    ) {

        this.lastGPSPosition = {

            lat:
                latitude,

            lng:
                longitude,

            accuracy:
                accuracy
        };


        // ========================================================
        // GPS DOT
        // ========================================================

        if (
            !this.gpsMarker
        ) {

            this.gpsMarker =
                L.circleMarker(
                    [
                        latitude,
                        longitude
                    ],
                    {
                        radius:
                            8,

                        color:
                            "#ffffff",

                        weight:
                            3,

                        fillColor:
                            "#2563eb",

                        fillOpacity:
                            1,

                        interactive:
                            false
                    }
                ).addTo(
                    this.map
                );

        } else {

            this.gpsMarker.setLatLng(
                [
                    latitude,
                    longitude
                ]
            );
        }


        // ========================================================
        // ACCURACY CIRCLE
        // ========================================================

        if (
            !this.gpsAccuracyCircle
        ) {

            this.gpsAccuracyCircle =
                L.circle(
                    [
                        latitude,
                        longitude
                    ],
                    {
                        radius:
                            accuracy || 10,

                        color:
                            "#2563eb",

                        weight:
                            1,

                        fillColor:
                            "#60a5fa",

                        fillOpacity:
                            0.15,

                        interactive:
                            false
                    }
                ).addTo(
                    this.map
                );

        } else {

            this.gpsAccuracyCircle.setLatLng(
                [
                    latitude,
                    longitude
                ]
            );

            this.gpsAccuracyCircle.setRadius(
                accuracy || 10
            );
        }
    }


    // ============================================================
    // START REAL-TIME NAVIGATION
    // ============================================================
    // ============================================================
// FIND NEAREST GOOGLE EARTH CAMPUS PATH POINT
// ============================================================

getNearestCampusPathPoint(latitude, longitude) {

    let nearestPoint = null;
    let smallestDistance = Infinity;

    if (!campusPaths || !Array.isArray(campusPaths)) {
        return null;
    }

    const toRadians = (degrees) => {
        return degrees * Math.PI / 180;
    };

    const calculateDistance = (
        lat1,
        lng1,
        lat2,
        lng2
    ) => {

        const earthRadius = 6371000;

        const latitudeDelta =
            toRadians(lat2 - lat1);

        const longitudeDelta =
            toRadians(lng2 - lng1);

        const firstLatitude =
            toRadians(lat1);

        const secondLatitude =
            toRadians(lat2);

        const a =
            Math.sin(latitudeDelta / 2) ** 2 +
            Math.cos(firstLatitude) *
            Math.cos(secondLatitude) *
            Math.sin(longitudeDelta / 2) ** 2;

        return earthRadius * 2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );
    };

    campusPaths.forEach(path => {

        if (
            !path.coordinates ||
            path.coordinates.length === 0
        ) {
            return;
        }

        path.coordinates.forEach(coordinate => {

            const pathLatitude =
                coordinate[0];

            const pathLongitude =
                coordinate[1];

            const distance =
                calculateDistance(
                    latitude,
                    longitude,
                    pathLatitude,
                    pathLongitude
                );

            if (distance < smallestDistance) {

                smallestDistance =
                    distance;

                nearestPoint = {
                    lat: pathLatitude,
                    lng: pathLongitude,
                    distance: distance,
                    pathId: path.id,
                    pathName: path.name
                };
            }
        });
    });

    return nearestPoint;
}
    startLiveNavigation() {

    

        // --------------------------------------------------------
        // Check browser support
        // --------------------------------------------------------

        if (
            !navigator.geolocation
        ) {

            console.error(
                "Geolocation is not supported by this browser."
            );

            return;
        }


        // --------------------------------------------------------
        // Stop previous GPS watch
        // --------------------------------------------------------

        this.stopLiveNavigation();


        // --------------------------------------------------------
        // Enable navigation
        // --------------------------------------------------------

        this.navigationActive =
            true;

        this.previousGPSPosition =
            null;


        console.log(
            "REAL-TIME NAVIGATION STARTED"
        );


        // ========================================================
        // CONTINUOUS GPS
        // ========================================================

        this.gpsWatchId =
            navigator.geolocation.watchPosition(

                position => {

                    if (
                        !this.navigationActive
                    ) {
                        return;
                    }


                    // ==================================================
                    // CURRENT POSITION
                    // ==================================================

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;

                    const accuracy =
                        position.coords.accuracy;


                    // ==================================================
                    // GET DEVICE GPS HEADING
                    // ==================================================

                    let heading =
                        position.coords.heading;


                    // ==================================================
                    // IF HEADING IS NOT AVAILABLE
                    // CALCULATE FROM MOVEMENT
                    // ==================================================

                    if (
                        heading === null ||
                        heading === undefined ||
                        Number.isNaN(heading)
                    ) {

                        if (
                            this.previousGPSPosition
                        ) {

                            const distanceMoved =
                                this.calculateDistance(
                                    {
                                        lat:
                                            this.previousGPSPosition.lat,

                                        lng:
                                            this.previousGPSPosition.lng
                                    },
                                    {
                                        lat:
                                            latitude,

                                        lng:
                                            longitude
                                    }
                                );

                            // Only calculate direction when
                            // the user actually moved enough.

                            if (
                                distanceMoved >= 1
                            ) {

                                heading =
                                    this.calculateBearing(
                                        this.previousGPSPosition.lat,
                                        this.previousGPSPosition.lng,
                                        latitude,
                                        longitude
                                    );
                            }
                        }
                    }


                    // ==================================================
                    // KEEP LAST HEADING
                    // ==================================================

                    if (
                        heading === null ||
                        heading === undefined ||
                        Number.isNaN(heading)
                    ) {

                        heading =
                            this.currentHeading;
                    }


                    this.currentHeading =
                        heading;


                    // ==================================================
                    // UPDATE GPS DOT
                    // ==================================================

                    this.updateGPSMarker(
                        latitude,
                        longitude,
                        accuracy
                    );


                    // ========================================================
// SNAP NAVIGATION ARROW TO NEAREST CAMPUS PATH
// ========================================================

// ========================================================
// UPDATE NAVIGATION POSITION
// ========================================================

if (this.campusNavigationActive) {

    // User is inside / near MBU
    // Follow the actual campus path

    const nearestPathPoint =
        this.getNearestCampusPathPoint(
            latitude,
            longitude
        );

    if (nearestPathPoint) {

        this.updateNavigationMarker(
            nearestPathPoint.lat,
            nearestPathPoint.lng,
            heading
        );

    } else {

        this.updateNavigationMarker(
            latitude,
            longitude,
            heading
        );
    }

} else {

    // User is outside MBU
    // NEVER snap GPS to a campus path

    this.updateNavigationMarker(
        latitude,
        longitude,
        heading
    );
}

                    // ==================================================
                    // SAVE PREVIOUS GPS POSITION
                    // ==================================================

                    this.previousGPSPosition = {

                        lat:
                            latitude,

                        lng:
                            longitude
                    };


                    // ==================================================
                    // MOVE MAP WITH USER
                    // ==================================================

                    const zoom =
                        Math.max(
                            this.map.getZoom(),
                            18
                        );

                    this.map.setView(
                        [
                            latitude,
                            longitude
                        ],
                        zoom,
                        {
                            animate:
                                true
                        }
                    );


                    // ==================================================
                    // FIND NEAREST CAMPUS NODE
                    // ==================================================

                    const nearestNode =
                        this.getNearestNode(
                            latitude,
                            longitude
                        );


                    // ==================================================
                    // SEND LIVE NAVIGATION EVENT
                    // ==================================================

                    window.dispatchEvent(
                        new CustomEvent(
                            "campus:navigation-update",
                            {
                                detail: {

                                    lat:
                                        latitude,

                                    lng:
                                        longitude,

                                    accuracy:
                                        accuracy,

                                    heading:
                                        heading,

                                    speed:
                                        position.coords.speed,

                                    nearestNode:
                                        nearestNode
                                }
                            }
                        )
                    );


                    // ==================================================
                    // CHECK DESTINATION
                    // ==================================================

                    this.checkDestinationReached(
                        latitude,
                        longitude
                    );


                    console.log(
                        "LIVE GPS:",
                        latitude,
                        longitude,
                        "HEADING:",
                        heading,
                        "ACCURACY:",
                        accuracy
                    );
                },


                // ====================================================
                // GPS ERROR
                // ====================================================

                error => {

                    console.error(
                        "Real-time GPS error:",
                        error
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            "campus:gps-error",
                            {
                                detail:
                                    error
                            }
                        )
                    );
                },


                // ====================================================
                // GPS OPTIONS
                // ====================================================

                {
                    enableHighAccuracy:
                        true,

                    timeout:
                        10000,

                    maximumAge:
                        1000
                }
            );
    }


    // ============================================================
    // CALCULATE BEARING
    // ============================================================

    calculateBearing(
        lat1,
        lng1,
        lat2,
        lng2
    ) {

        const startLat =
            lat1 *
            Math.PI /
            180;

        const startLng =
            lng1 *
            Math.PI /
            180;

        const endLat =
            lat2 *
            Math.PI /
            180;

        const endLng =
            lng2 *
            Math.PI /
            180;

        const deltaLng =
            endLng -
            startLng;

        const y =
            Math.sin(deltaLng) *
            Math.cos(endLat);

        const x =
            Math.cos(startLat) *
            Math.sin(endLat)
            -
            Math.sin(startLat) *
            Math.cos(endLat) *
            Math.cos(deltaLng);

        const bearing =
            Math.atan2(
                y,
                x
            ) *
            180 /
            Math.PI;

        return (
            bearing + 360
        ) % 360;
    }


    // ============================================================
    // UPDATE NAVIGATION MARKER
    // ============================================================

    updateNavigationMarker(
        latitude,
        longitude,
        heading
    ) {

        const rotation =
            Number.isFinite(
                heading
            )
                ? heading
                : 0;


        // ========================================================
        // CREATE BLUE ARROW
        // ========================================================

        if (
            !this.navigationMarker
        ) {

            this.navigationMarker =
                L.marker(
                    [
                        latitude,
                        longitude
                    ],
                    {
                        icon:
                            this.createNavigationIcon(
                                rotation
                            ),

                        zIndexOffset:
                            5000,

                        interactive:
                            false,

                        keyboard:
                            false
                    }
                );

            this.navigationMarker.addTo(
                this.map
            );

            return;
        }


        // ========================================================
        // UPDATE POSITION
        // ========================================================

        this.navigationMarker.setLatLng(
            [
                latitude,
                longitude
            ]
        );


        // ========================================================
        // UPDATE DIRECTION
        // ========================================================

        this.navigationMarker.setIcon(
            this.createNavigationIcon(
                rotation
            )
        );
    }


    // ============================================================
    // CREATE BLUE GOOGLE-MAPS STYLE ARROW
    // ============================================================

    createNavigationIcon(
        heading
    ) {

        return L.divIcon({

            className:
                "real-time-navigation-marker",

            html:
                `
                <div style="
                    width:46px;
                    height:46px;

                    display:flex;
                    align-items:center;
                    justify-content:center;

                    transform:
                        rotate(${heading}deg);

                    transition:
                        transform 0.2s ease;

                    filter:
                        drop-shadow(
                            0 2px 4px
                            rgba(0,0,0,0.4)
                        );
                ">

                    <div style="
                        position:relative;

                        width:0;
                        height:0;

                        border-left:
                            12px solid transparent;

                        border-right:
                            12px solid transparent;

                        border-bottom:
                            36px solid #2563eb;
                    ">

                        <div style="
                            position:absolute;

                            width:8px;
                            height:8px;

                            border-radius:50%;

                            background:#ffffff;

                            left:-4px;

                            top:18px;
                        ">
                        </div>

                    </div>

                </div>
                `,

            iconSize:
                [
                    46,
                    46
                ],

            iconAnchor:
                [
                    23,
                    23
                ]
        });
    }


    // ============================================================
    // DESTINATION CHECK
    // ============================================================

    checkDestinationReached(
        latitude,
        longitude
    ) {

        if (
            !this.navigationDestination
        ) {
            return;
        }

        const destination =
            this.navigationDestination;

        const distance =
            this.calculateDistance(
                {
                    lat:
                        latitude,

                    lng:
                        longitude
                },
                {
                    lat:
                        destination.lat,

                    lng:
                        destination.lng
                }
            );


        // ========================================================
        // DESTINATION REACHED
        // ========================================================

        if (
            distance <= 15
        ) {

            console.log(
                "DESTINATION REACHED:",
                destination.name
            );


            window.dispatchEvent(
                new CustomEvent(
                    "campus:destination-reached",
                    {
                        detail: {

                            destination:
                                destination,

                            distance:
                                distance
                        }
                    }
                )
            );


            this.stopLiveNavigation();
        }
    }


    // ============================================================
    // STOP REAL-TIME NAVIGATION
    // ============================================================

    stopLiveNavigation() {

        this.navigationActive =
            false;


        // ========================================================
        // STOP GPS WATCH
        // ========================================================

        if (
            this.gpsWatchId !== null
        ) {

            navigator.geolocation.clearWatch(
                this.gpsWatchId
            );

            this.gpsWatchId =
                null;
        }


        // ========================================================
        // REMOVE NAVIGATION ARROW
        // ========================================================

        if (
            this.navigationMarker
        ) {

            this.map.removeLayer(
                this.navigationMarker
            );

            this.navigationMarker =
                null;
        }


        this.previousGPSPosition =
            null;

        this.navigationRouteCoordinates =
            [];

        this.navigationDestination =
            null;
    }


    // ============================================================
    // NORMAL ONE-TIME GPS
    // ============================================================

    startGPS(
        options = {}
    ) {

        if (
            !navigator.geolocation
        ) {

            return Promise.reject(
                new Error(
                    "GPS is not supported by this browser."
                )
            );
        }


        const {
            centerMap = true,
            zoom = 18,
            enableHighAccuracy = true,
            timeout = 15000,
            maximumAge = 5000
        } = options;


        return new Promise(
            (
                resolve,
                reject
            ) => {

                navigator.geolocation.getCurrentPosition(

                    position => {

                        const latitude =
                            position.coords.latitude;

                        const longitude =
                            position.coords.longitude;

                        const accuracy =
                            position.coords.accuracy;


                        this.updateGPSMarker(
                            latitude,
                            longitude,
                            accuracy
                        );


                        if (
                            centerMap
                        ) {

                            this.map.flyTo(
                                [
                                    latitude,
                                    longitude
                                ],
                                Math.max(
                                    this.map.getZoom(),
                                    zoom
                                ),
                                {
                                    duration:
                                        1
                                }
                            );
                        }


                        const nearestNode =
                            this.getNearestNode(
                                latitude,
                                longitude
                            );


                        const detail = {

                            lat:
                                latitude,

                            lng:
                                longitude,

                            accuracy:
                                accuracy,

                            nearestNode:
                                nearestNode
                        };


                        window.dispatchEvent(
                            new CustomEvent(
                                "campus:gps-location",
                                {
                                    detail:
                                        detail
                                }
                            )
                        );


                        resolve(
                            detail
                        );
                    },


                    error => {

                        reject(
                            error
                        );
                    },


                    {
                        enableHighAccuracy:
                            enableHighAccuracy,

                        timeout:
                            timeout,

                        maximumAge:
                            maximumAge
                    }
                );
            }
        );
    }


    // ============================================================
    // NORMAL CONTINUOUS GPS
    // ============================================================

    watchGPS(
        options = {}
    ) {

        if (
            !navigator.geolocation
        ) {

            return Promise.reject(
                new Error(
                    "GPS is not supported by this browser."
                )
            );
        }


        this.stopGPS();


        const {
            centerMap = false,
            zoom = 18,
            enableHighAccuracy = true,
            timeout = 15000,
            maximumAge = 3000
        } = options;


        return new Promise(
            (
                resolve,
                reject
            ) => {

                let firstUpdate =
                    true;


                this.gpsWatchId =
                    navigator.geolocation.watchPosition(

                        position => {

                            const latitude =
                                position.coords.latitude;

                            const longitude =
                                position.coords.longitude;

                            const accuracy =
                                position.coords.accuracy;


                            this.updateGPSMarker(
                                latitude,
                                longitude,
                                accuracy
                            );


                            if (
                                centerMap ||
                                firstUpdate
                            ) {

                                this.map.flyTo(
                                    [
                                        latitude,
                                        longitude
                                    ],
                                    Math.max(
                                        this.map.getZoom(),
                                        zoom
                                    ),
                                    {
                                        duration:
                                            1
                                    }
                                );
                            }


                            firstUpdate =
                                false;


                            const nearestNode =
                                this.getNearestNode(
                                    latitude,
                                    longitude
                                );


                            const detail = {

                                lat:
                                    latitude,

                                lng:
                                    longitude,

                                accuracy:
                                    accuracy,

                                nearestNode:
                                    nearestNode
                            };


                            window.dispatchEvent(
                                new CustomEvent(
                                    "campus:gps-location",
                                    {
                                        detail:
                                            detail
                                    }
                                )
                            );


                            resolve(
                                detail
                            );
                        },


                        error => {

                            reject(
                                error
                            );
                        },


                        {
                            enableHighAccuracy:
                                enableHighAccuracy,

                            timeout:
                                timeout,

                            maximumAge:
                                maximumAge
                        }
                    );
            }
        );
    }


    // ============================================================
    // STOP GPS
    // ============================================================

    stopGPS() {

        if (
            this.gpsWatchId !== null
        ) {

            navigator.geolocation.clearWatch(
                this.gpsWatchId
            );

            this.gpsWatchId =
                null;
        }
    }


    // ============================================================
    // CLEAR GPS MARKER
    // ============================================================

    clearGPSMarker() {

        if (
            this.gpsMarker
        ) {

            this.map.removeLayer(
                this.gpsMarker
            );

            this.gpsMarker =
                null;
        }


        if (
            this.gpsAccuracyCircle
        ) {

            this.map.removeLayer(
                this.gpsAccuracyCircle
            );

            this.gpsAccuracyCircle =
                null;
        }


        this.lastGPSPosition =
            null;
    }


    // ============================================================
    // LAST GPS POSITION
    // ============================================================

    
    getLastGPSPosition() {

    return this.lastGPSPosition;
}


// ============================================================
// DRAW GOOGLE EARTH CAMPUS PATHS
// ============================================================

drawCampusPaths() {

    if (!campusPaths || !Array.isArray(campusPaths)) {
        console.error("Campus paths not loaded.");
        return;
    }

    this.campusPathLayer.clearLayers();

    campusPaths.forEach((path) => {

        if (!path.coordinates || path.coordinates.length < 2) {
            return;
        }

        const line = L.polyline(
            path.coordinates,
            {
                weight: 5,
                opacity: 0.75,
                lineCap: "round",
                lineJoin: "round"
            }
        );

        line.bindTooltip(
            path.name || "Campus Path"
        );

        line.addTo(this.campusPathLayer);
    });

    console.log(
        "Google Earth campus paths loaded:",
        campusPaths.length
    );
}

}

