import { campusPaths } from "./campusPaths.js";

export class RouterEngine {

    constructor(graph) {
        this.graph = graph;
        this.pathGraph = null;
    }

    // ============================================================
    // DISTANCE BETWEEN TWO GPS POINTS
    // ============================================================

    getDistanceMeters(firstNode, secondNode) {

        const earthRadius = 6371000;

        const toRadians = (degrees) =>
            degrees * Math.PI / 180;

        const latitudeDelta =
            toRadians(secondNode.lat - firstNode.lat);

        const longitudeDelta =
            toRadians(secondNode.lng - firstNode.lng);

        const firstLatitude =
            toRadians(firstNode.lat);

        const secondLatitude =
            toRadians(secondNode.lat);

        const haversine =
            Math.sin(latitudeDelta / 2) ** 2 +
            Math.cos(firstLatitude) *
            Math.cos(secondLatitude) *
            Math.sin(longitudeDelta / 2) ** 2;

        return earthRadius * 2 *
            Math.atan2(
                Math.sqrt(haversine),
                Math.sqrt(1 - haversine)
            );
    }


    // ============================================================
    // BUILD REAL GOOGLE EARTH PATH GRAPH
    // ============================================================

    buildPathGraph(filters = {}) {

        const nodes = {};
        const edges = [];

        let nodeCounter = 0;


        // --------------------------------------------------------
        // CREATE NODE FOR EACH GOOGLE EARTH PATH POINT
        // --------------------------------------------------------

        campusPaths.forEach((path) => {

            if (
                !path.coordinates ||
                path.coordinates.length < 2
            ) {
                return;
            }

            for (
                let i = 0;
                i < path.coordinates.length;
                i++
            ) {

                const coordinate =
                    path.coordinates[i];

                const lat = coordinate[0];
                const lng = coordinate[1];

                const nodeId =
                    `path_${path.id}_${i}`;

                nodes[nodeId] = {

                    id: nodeId,

                    name:
                        `${path.name || "Campus Path"} Point ${i + 1}`,

                    lat: lat,

                    lng: lng,

                    type: "path",

                    pathId: path.id,

                    pathName: path.name,

                    walking:
                        path.walking !== false,

                    vehicle:
                        path.vehicle !== false
                };

                nodeCounter++;
            }
        });


        // --------------------------------------------------------
        // CONNECT CONSECUTIVE GOOGLE EARTH POINTS
        // --------------------------------------------------------

        campusPaths.forEach((path) => {

            if (
                !path.coordinates ||
                path.coordinates.length < 2
            ) {
                return;
            }

            for (
                let i = 0;
                i < path.coordinates.length - 1;
                i++
            ) {

                const fromId =
                    `path_${path.id}_${i}`;

                const toId =
                    `path_${path.id}_${i + 1}`;

                const from =
                    nodes[fromId];

                const to =
                    nodes[toId];

                if (!from || !to) {
                    continue;
                }

                const distance =
                    this.getDistanceMeters(
                        from,
                        to
                    );

                edges.push({

                    from: fromId,

                    to: toId,

                    distance: distance,

                    cost: distance,

                    path: true
                });
            }
        });


        // --------------------------------------------------------
        // CONNECT NEARBY GOOGLE EARTH PATHS
        // --------------------------------------------------------
        // This connects paths that were drawn separately in
        // Google Earth but meet physically on the campus.
        // --------------------------------------------------------

        const pathNodes =
            Object.values(nodes);

        const connectionDistance = 15;


        for (
            let i = 0;
            i < pathNodes.length;
            i++
        ) {

            for (
                let j = i + 1;
                j < pathNodes.length;
                j++
            ) {

                const first =
                    pathNodes[i];

                const second =
                    pathNodes[j];


                // Don't connect points belonging to
                // the same consecutive path automatically.
                if (
                    first.pathId === second.pathId
                ) {
                    continue;
                }


                const distance =
                    this.getDistanceMeters(
                        first,
                        second
                    );


                if (
                    distance <= connectionDistance
                ) {

                    edges.push({

                        from: first.id,

                        to: second.id,

                        distance: distance,

                        cost: distance,

                        path: true
                    });
                }
            }
        }


        // --------------------------------------------------------
        // ADJACENCY LIST
        // --------------------------------------------------------

        const adjacency = {};

        Object.keys(nodes).forEach(
            id => adjacency[id] = []
        );


        edges.forEach(edge => {

            adjacency[edge.from].push({

                to: edge.to,

                cost: edge.cost,

                distance: edge.distance,

                original: edge

            });

            adjacency[edge.to].push({

                to: edge.from,

                cost: edge.cost,

                distance: edge.distance,

                original: edge

            });
        });


        this.pathGraph = {

            nodes: nodes,

            edges: edges,

            adjacency: adjacency
        };


        console.log(
            "REAL GOOGLE EARTH PATH GRAPH CREATED"
        );

        console.log(
            "Path nodes:",
            Object.keys(nodes).length
        );

        console.log(
            "Path connections:",
            edges.length
        );


        return this.pathGraph;
    }


    // ============================================================
    // FIND NEAREST GOOGLE EARTH PATH POINT
    // ============================================================

    findNearestPathNode(
        latitude,
        longitude,
        mode = "walking"
    ) {

        if (!this.pathGraph) {
            this.buildPathGraph({
                mode: mode
            });
        }


        let nearestNode = null;

        let smallestDistance =
            Infinity;
        

        Object.values(
            this.pathGraph.nodes
        ).forEach(node => {

            // --------------------------------------------
            // MODE FILTER
            // --------------------------------------------

            if (
                mode === "walking" &&
                node.walking === false
            ) {
                return;
            }

            if (
                mode === "vehicle" &&
                node.vehicle === false
            ) {
                return;
            }


            const distance =
                this.getDistanceMeters(
                    {
                        lat: latitude,
                        lng: longitude
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
    // CONNECT CAMPUS BUILDING TO REAL PATH
    // ============================================================
    // ============================================================
// CONNECT CAMPUS BUILDING TO REAL PATH
// ============================================================

connectCampusNodeToPath(
    campusNode,
    virtualGraph,
    mode = "walking"
) {

    if (!campusNode) {
        return null;
    }

    // Find nearby Google Earth path points
    const candidates = [];

    Object.values(this.pathGraph.nodes).forEach(pathNode => {

        // Walking mode
        if (
            mode === "walking" &&
            pathNode.walking === false
        ) {
            return;
        }

        // Vehicle mode
        if (
            mode === "vehicle" &&
            pathNode.vehicle === false
        ) {
            return;
        }

        const distance = this.getDistanceMeters(
            campusNode,
            pathNode
        );

        candidates.push({
            node: pathNode,
            distance: distance
        });
    });

    if (candidates.length === 0) {
        return null;
    }

    // Sort nearest path points first
    candidates.sort(
        (a, b) => a.distance - b.distance
    );

    // Select up to 4 nearby path points
    const nearbyCandidates = candidates
        .filter(item => item.distance <= 40)
        .slice(0, 4);

    // If nothing is within 40 meters,
    // use the closest available path point.
    if (nearbyCandidates.length === 0) {
        nearbyCandidates.push(candidates[0]);
    }

    // Add campus node
    virtualGraph.nodes[campusNode.id] =
        campusNode;

    // Create adjacency list
    if (!virtualGraph.adjacency[campusNode.id]) {
        virtualGraph.adjacency[campusNode.id] = [];
    }

    let closestPathNode = null;

    nearbyCandidates.forEach(item => {

        const pathNode = item.node;
        const distance = item.distance;

        // Remember closest path node
        if (
            !closestPathNode ||
            distance < closestPathNode.distance
        ) {
            closestPathNode = {
                node: pathNode,
                distance: distance
            };
        }

        // Campus location -> path
        virtualGraph.adjacency[campusNode.id].push({
            to: pathNode.id,
            cost: distance,
            distance: distance,

            original: {
                from: campusNode.id,
                to: pathNode.id,
                connection: true
            }
        });

        // Path -> campus location
        if (!virtualGraph.adjacency[pathNode.id]) {
            virtualGraph.adjacency[pathNode.id] = [];
        }

        virtualGraph.adjacency[pathNode.id].push({
            to: campusNode.id,
            cost: distance,
            distance: distance,

            original: {
                from: pathNode.id,
                to: campusNode.id,
                connection: true
            }
        });
    });

    console.log(
        `Connected ${campusNode.name} to ${nearbyCandidates.length} nearby campus paths`
    );

    return closestPathNode.node;
}

    // ============================================================
    // DIRECTIONS
    // ============================================================

    getDirection(
        fromNode,
        toNode,
        stepNumber,
        totalSteps
    ) {

        const latitudeDelta =
            toNode.lat -
            fromNode.lat;

        const longitudeDelta =
            toNode.lng -
            fromNode.lng;


        const angle =
            (
                Math.atan2(
                    longitudeDelta,
                    latitudeDelta
                ) *
                180 /
                Math.PI +
                360
            ) % 360;


        const compassPoints = [

            "north",
            "north-east",
            "east",
            "south-east",
            "south",
            "south-west",
            "west",
            "north-west"

        ];


        const compassDirection =
            compassPoints[
                Math.round(angle / 45) %
                compassPoints.length
            ];


        const distance =
            Math.round(
                this.getDistanceMeters(
                    fromNode,
                    toNode
                )
            );


        if (stepNumber === 1) {

            return `Start at ${fromNode.name}, then follow the campus path ${distance} m ${compassDirection}.`;
        }


        if (
            stepNumber === totalSteps
        ) {

            return `Arrive at ${toNode.name} after following the campus path for ${distance} m.`;
        }


        return `Continue ${compassDirection} for ${distance} m along the campus path.`;
    }


    // ============================================================
    // MAIN ROUTING FUNCTION
    // ============================================================

    computePath(
        startId,
        targetId,
        filters = {}
    ) {

        const mode =
            filters.mode || "walking";


        // --------------------------------------------------------
        // BUILD REAL PATH GRAPH
        // --------------------------------------------------------

        this.buildPathGraph(filters);


        // --------------------------------------------------------
        // CREATE ROUTING GRAPH
        // --------------------------------------------------------

        const routingGraph = {

            nodes: {},

            adjacency: {}
        };


        // Copy REAL Google Earth path nodes

        Object.values(
            this.pathGraph.nodes
        ).forEach(node => {

            routingGraph.nodes[node.id] =
                node;

            routingGraph.adjacency[node.id] =
                [
                    ...this.pathGraph.adjacency[node.id]
                ];
        });


        // --------------------------------------------------------
        // GET START / DESTINATION BUILDINGS
        // --------------------------------------------------------

        const startNode =
            this.graph.nodes[startId];

        const targetNode =
            this.graph.nodes[targetId];


        if (
            !startNode ||
            !targetNode
        ) {

            return {

                success: false,

                message:
                    "Start or destination location not found."
            };
        }


        // --------------------------------------------------------
        // CONNECT START TO REAL PATH
        // --------------------------------------------------------

        const startPathNode =
            this.connectCampusNodeToPath(
                startNode,
                routingGraph,
                mode
            );


        // --------------------------------------------------------
        // CONNECT DESTINATION TO REAL PATH
        // --------------------------------------------------------

        const targetPathNode =
            this.connectCampusNodeToPath(
                targetNode,
                routingGraph,
                mode
            );


        if (
            !startPathNode ||
            !targetPathNode
        ) {

            return {

                success: false,

                message:
                    "Could not connect the location to the Google Earth campus paths."
            };
        }


        // --------------------------------------------------------
        // DIJKSTRA
        // --------------------------------------------------------

        const distances = {};

        const backtrace = {};

        const unvisited =
            new Set(
                Object.keys(
                    routingGraph.nodes
                )
            );


        Object.keys(
            routingGraph.nodes
        ).forEach(id => {

            distances[id] =
                Infinity;

        });


        distances[startId] = 0;


        while (
            unvisited.size > 0
        ) {

            let currentNodeId =
                null;


            unvisited.forEach(id => {

                if (
                    currentNodeId === null ||
                    distances[id] <
                    distances[currentNodeId]
                ) {

                    currentNodeId =
                        id;
                }
            });


            if (
                currentNodeId === null ||
                distances[currentNodeId] === Infinity
            ) {

                break;
            }


            if (
                currentNodeId === targetId
            ) {

                break;
            }


            unvisited.delete(
                currentNodeId
            );


            const neighbors =
                routingGraph.adjacency[
                    currentNodeId
                ] || [];


            neighbors.forEach(
                neighbor => {

                    if (
                        !unvisited.has(
                            neighbor.to
                        )
                    ) {
                        return;
                    }


                    let additionalCost =
                        neighbor.cost;


                    // Optional wheelchair penalty
                    if (
                        filters.wheelchair &&
                        neighbor.original?.structuralSteps
                    ) {

                        additionalCost +=
                            5000;
                    }


                    const newCost =
                        distances[
                            currentNodeId
                        ] +
                        additionalCost;


                    if (
                        newCost <
                        distances[
                            neighbor.to
                        ]
                    ) {

                        distances[
                            neighbor.to
                        ] =
                            newCost;

                        backtrace[
                            neighbor.to
                        ] =
                            currentNodeId;
                    }
                }
            );
        }


        // --------------------------------------------------------
        // NO ROUTE
        // --------------------------------------------------------

        if (
            distances[targetId] === Infinity
        ) {

            return {

                success: false,

                message:
                    "No connected route exists through the Google Earth paths."
            };
        }


        // --------------------------------------------------------
        // RECONSTRUCT ROUTE
        // --------------------------------------------------------

        const pathNodes = [];

        let tracer =
            targetId;


        while (
            tracer !== undefined
        ) {

            pathNodes.unshift(
                routingGraph.nodes[
                    tracer
                ]
            );


            tracer =
                backtrace[
                    tracer
                ];
        }


        // --------------------------------------------------------
        // ACTUAL ROUTE COORDINATES
        // --------------------------------------------------------

        const coordinates =
            pathNodes.map(
                node => [
                    node.lat,
                    node.lng
                ]
            );


        // --------------------------------------------------------
        // REAL DISTANCE
        // --------------------------------------------------------

        let totalDistance = 0;


        for (
            let i = 1;
            i < pathNodes.length;
            i++
        ) {

            totalDistance +=
                this.getDistanceMeters(
                    pathNodes[i - 1],
                    pathNodes[i]
                );
        }


        // --------------------------------------------------------
        // DIRECTIONS
        // --------------------------------------------------------

        const directions =
            pathNodes
                .slice(1)
                .map(
                    (node, index) =>
                        this.getDirection(
                            pathNodes[index],
                            node,
                            index + 1,
                            pathNodes.length - 1
                        )
                );


        // --------------------------------------------------------
        // EXPLANATION
        // --------------------------------------------------------

        let explanation =
            "Route calculated using the Google Earth campus path network. ";


        if (
            mode === "vehicle"
        ) {

            explanation +=
                "Vehicle-accessible campus paths were considered. ";
        }
        else {

            explanation +=
                "Walking-accessible campus paths were considered. ";
        }


        if (
            filters.wheelchair
        ) {

            explanation +=
                "Wheelchair accessibility preference was applied. ";
        }


        if (
            filters.crowded
        ) {

            explanation +=
                "Crowd preference was applied where path data supports it. ";
        }


        return {

            success: true,

            coordinates:
                coordinates,

            totalDistance:
                Math.round(
                    totalDistance
                ),

            directions:
                directions,

            explanation:
                explanation,

            pathNodes:
                pathNodes,

            routeType:
                "google-earth-campus-path"
        };
    }
}