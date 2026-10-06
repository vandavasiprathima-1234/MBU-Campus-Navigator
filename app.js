import { MapEngine } from './modules/mapEngine.js';

import { RouterEngine } from './modules/router.js';

import { SemanticSearch } from './modules/search.js';

import { AnalyticsEngine } from './modules/analytics.js';

import { roomDirectory } from './modules/roomDirectory.js';

import {

    speak,

    speakTurn,

    speakArrival

} from './modules/voiceNavigation.js';

document.addEventListener('DOMContentLoaded', () => {



    // ============================================================

    // INITIALIZE MAP

    // ============================================================



    const mapModule = new MapEngine('map');

    const graph = mapModule.getCampusGraph();



    // ============================================================

    // INITIALIZE CORE SYSTEMS

    // ============================================================



    const router = new RouterEngine(graph);

    const searchEngine = new SemanticSearch(graph);

    const analytics = new AnalyticsEngine();



    // ============================================================

    // CURRENT START LOCATION

    // ============================================================



    let currentStartNodeId = 'node_main_gate_checkpoint';



    let gpsNavigationActive = false;

    let currentGPSLocation = null;

    // ============================================================
    // VOICE NAVIGATION
    // ============================================================

    let activeVoiceRoute = [];
    let voiceWaypointIndex = 1;
    let lastVoiceInstruction = '';
    let lastVoiceInstructionTime = 0;

    function getRoutePoint(point) {
        if (Array.isArray(point) && point.length >= 2) {
            return { lat: Number(point[0]), lng: Number(point[1]) };
        }
        if (point && typeof point === 'object') {
            return {
                lat: Number(point.lat ?? point.latitude),
                lng: Number(point.lng ?? point.longitude)
            };
        }
        return null;
    }

    function geoDistanceMeters(lat1, lng1, lat2, lng2) {
        const R = 6371000;
        const toRad = value => value * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function geoBearing(lat1, lng1, lat2, lng2) {
        const toRad = value => value * Math.PI / 180;
        const toDeg = value => value * 180 / Math.PI;
        const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
        const x =
            Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.cos(toRad(lng2 - lng1));
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }

    function signedAngleDifference(target, current) {
        return ((target - current + 540) % 360) - 180;
    }

    function speakNavigation(text, type = 'normal') {
        if (!text) return;
        try {
            if (type === 'arrival' && typeof speakArrival === 'function') {
                speakArrival(text);
            } else if (type === 'turn' && typeof speakTurn === 'function') {
                speakTurn(text);
            } else if (typeof speak === 'function') {
                speak(text);
            }
        } catch (error) {
            console.warn('Voice navigation error:', error);
        }
    }

    function resetVoiceNavigation(coordinates = []) {
        activeVoiceRoute = Array.isArray(coordinates)
            ? coordinates.map(getRoutePoint).filter(
                point => point && Number.isFinite(point.lat) && Number.isFinite(point.lng)
            )
            : [];
        voiceWaypointIndex = 1;
        lastVoiceInstruction = '';
        lastVoiceInstructionTime = 0;
    }

    function updateVoiceNavigation(detail) {
        if (activeVoiceRoute.length < 3) return;
        const latitude = Number(detail.lat);
        const longitude = Number(detail.lng);
        const heading = Number(detail.heading);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        while (voiceWaypointIndex < activeVoiceRoute.length - 1) {
            const waypoint = activeVoiceRoute[voiceWaypointIndex];
            if (geoDistanceMeters(latitude, longitude, waypoint.lat, waypoint.lng) <= 18) {
                voiceWaypointIndex += 1;
            } else {
                break;
            }
        }

        if (voiceWaypointIndex >= activeVoiceRoute.length - 1) return;

        const waypoint = activeVoiceRoute[voiceWaypointIndex];
        const previous = activeVoiceRoute[voiceWaypointIndex - 1];
        const next = activeVoiceRoute[voiceWaypointIndex + 1];
        if (!previous || !next) return;

        const distanceToWaypoint = geoDistanceMeters(
            latitude, longitude, waypoint.lat, waypoint.lng
        );
        if (distanceToWaypoint > 35) return;

        const incomingBearing = geoBearing(
            previous.lat, previous.lng, waypoint.lat, waypoint.lng
        );
        const outgoingBearing = geoBearing(
            waypoint.lat, waypoint.lng, next.lat, next.lng
        );
        const turnAngle = signedAngleDifference(outgoingBearing, incomingBearing);

        let instruction = 'Continue straight';
        if (turnAngle > 30) instruction = 'Turn right';
        if (turnAngle < -30) instruction = 'Turn left';

        if (Number.isFinite(heading) && heading >= 0) {
            const headingDifference = Math.abs(
                signedAngleDifference(outgoingBearing, heading)
            );
            if (headingDifference > 110) {
                instruction = 'You are going the wrong way. Please turn around';
            }
        }

        const now = Date.now();
        if (
            instruction !== lastVoiceInstruction ||
            now - lastVoiceInstructionTime > 12000
        ) {
            speakNavigation(instruction, 'turn');
            lastVoiceInstruction = instruction;
            lastVoiceInstructionTime = now;
        }
    }




    const graphNodes = Object.values(graph.nodes);



    // ============================================================

// FIND NEAREST CAMPUS NODE FROM GPS

// ============================================================



function getNearestGraphNode(latitude, longitude) {

    let nearestNode = null;

    let shortestDistance = Infinity;



    Object.values(graph.nodes).forEach(node => {



        if (

            typeof node.lat !== 'number' ||

            typeof node.lng !== 'number'

        ) {

            return;

        }



        const latDiff = node.lat - latitude;

        const lngDiff = node.lng - longitude;



        const distance =

            Math.sqrt(

                (latDiff * latDiff) +

                (lngDiff * lngDiff)

            );



        if (distance < shortestDistance) {

            shortestDistance = distance;

            nearestNode = node;

        }

    });



    return nearestNode;

}



    // ============================================================

    // DIRECTORY ROOM ANCHORS

    // ============================================================



    const directoryRoomAnchors = [

        {

            pattern: /PARMACUTICAL/i,

            nodeId: 'node_pharmaceutical_entrance'

        },

        {

            pattern: /VALMAR/i,

            nodeId: 'node_valmar_office'

        },

        {

            pattern: /MNS/i,

            nodeId: 'node_mns_block'

        },

        {

            pattern: /G\s*-\s*BLOCK/i,

            nodeId: 'node_g_block'

        }

    ];



    // ============================================================

    // GET ROOM LOCATION

    // ============================================================



    function getDirectoryRoomLocation(roomNumber, directoryEntry) {



        const number = Number(roomNumber);



        const floorName = (floorIndex) => {

            if (floorIndex === 0) return 'Ground Floor';

            if (floorIndex === 1) return '1st Floor';

            if (floorIndex === 2) return '2nd Floor';

            if (floorIndex === 3) return '3rd Floor';

            return `${floorIndex}th Floor`;

        };



        if (number >= 1401 && number <= 1612) {

            return {

                building: 'Pharmaceutical Block',

                floor:

                    number < 1500

                        ? 'Ground Floor'

                        : number < 1600

                            ? '1st Floor'

                            : '2nd Floor',

                anchorId: 'node_pharmaceutical_entrance'

            };

        }



        if (number >= 401 && number <= 825) {

            return {

                building: 'MNS Block - U-Shaped',

                floor:

                    number < 500

                        ? 'Ground Floor'

                        : number < 600

                            ? '1st Floor'

                            : number < 700

                                ? '2nd Floor'

                                : number < 800

                                    ? '3rd Floor'

                                    : '4th Floor',

                anchorId: 'node_mns_block'

            };

        }



        if (number >= 4000 && number <= 4524) {

            return {

                building: 'G-Block',

                floor:

                    number < 4100

                        ? 'Ground Floor'

                        : number < 4200

                            ? '1st Floor'

                            : number < 4300

                                ? '2nd Floor'

                                : number < 4400

                                    ? '3rd Floor'

                                    : number < 4500

                                        ? '4th Floor'

                                        : '5th Floor',

                anchorId: 'node_g_block'

            };

        }



        if (number >= 2500 && number < 2900) {

            return {

                building: 'Mechanical Block',

                floor: floorName(Math.floor(number / 100) - 25),

                anchorId: 'node_mechanical_block'

            };

        }



        if (number >= 1700 && number < 2100) {

            return {

                building: 'Degree Block',

                floor: floorName(Math.floor(number / 100) - 17),

                anchorId: 'node_degree_block'

            };

        }



        if (number >= 2100 && number < 2500) {

            return {

                building: 'Civil Block',

                floor: floorName(Math.floor(number / 100) - 21),

                anchorId: 'node_civil_block'

            };

        }



        if (number >= 100 && number < 200) {

            return {

                building:

                    number < 110

                        ? 'West Block'

                        : number < 124

                            ? 'South Block'

                            : 'East Block',

                floor: 'Ground Floor',

                anchorId:
                    number < 110
                        ? 'node_west_block'
                        : number < 124
                            ? 'node_south_block'
                            : 'node_east_block'

            };

        }



        if (number >= 200 && number < 300) {

            return {

                building:

                    number < 212

                        ? 'West Block'

                        : number < 219

                            ? 'South Block'

                            : 'East Block',

                floor: '1st Floor',

                anchorId:
                    number < 212
                        ? 'node_west_block'
                        : number < 219
                            ? 'node_south_block'
                            : 'node_east_block'

            };

        }



        if (number >= 300 && number < 400) {

            return {

                building:

                    number < 315

                        ? 'West Block'

                        : number < 320

                            ? 'South Block'

                            : 'East Block',

                floor: '2nd Floor',

                anchorId:
                    number < 315
                        ? 'node_west_block'
                        : number < 320
                            ? 'node_south_block'
                            : 'node_east_block'

            };

        }



        const anchor = directoryRoomAnchors.find(

            ({ pattern }) => pattern.test(directoryEntry.section)

        );



        return {

            building: directoryEntry.section,

            floor: directoryEntry.floor || 'Ground Floor',

            anchorId: anchor?.nodeId || 'node_canteen_hub'

        };

    }



    // ============================================================

    // RESOLVE ROOM

    // ============================================================



    function resolveDirectoryRoom(rawQuery) {



        const query = rawQuery

            .trim()

            .toUpperCase()

            .replace(/\s+/g, '');



        const roomMatch = query.match(/^(\d{3,4})-?([A-Z])?$/);



        if (!roomMatch) {

            return null;

        }



        const roomNumber = roomMatch[1];

        const roomSuffix = roomMatch[2] || '';



        const roomPattern = new RegExp(

            `(^|[^0-9])${roomNumber}(?:[- ]?${roomSuffix})?([^0-9]|$)`,

            'i'

        );



        const directoryEntry = directoryEntries.find((entry) => {

            const text =

                `${entry.section} ${entry.floor} ${entry.details}`;



            return roomPattern.test(text);

        });



        if (!directoryEntry) {

            return null;

        }



        const location = getDirectoryRoomLocation(

            roomNumber,

            directoryEntry

        );



        const anchorNode = graph.nodes[location.anchorId];



        if (!anchorNode) {

            return null;

        }



// Use the real building entrance as the routable destination.
        // The room metadata is retained for the UI and voice arrival message.
        return {
            ...anchorNode,
            name: `Room ${roomNumber}${roomSuffix} - ${directoryEntry.section}`,
            tags: [
                ...(Array.isArray(anchorNode.tags) ? anchorNode.tags : []),
                roomNumber,
                `${roomNumber}${roomSuffix}`
            ],
            meta: {
                ...(anchorNode.meta || {}),
                floor: location.floor,
                floorLabel: location.floor,
                building: location.building,
                roomNumber: `${roomNumber}${roomSuffix}`,
                directorySource: 'CAMPUS_ROOMNUMBERS_latest.xlsx',
                directoryAnchor: anchorNode.name,
                directorySection: directoryEntry.section,
                directoryDetails: directoryEntry.details
            }
        };
    }

    // ============================================================

    // INITIAL MAP RENDER

    // ============================================================



    mapModule.renderGraphNodes();



    analytics.renderHotspots();



    // ============================================================

    // ROOM DIRECTORY

    // ============================================================



    const directoryList =

        document.getElementById('roomDirectoryList');



    const directoryCount =

        document.getElementById('directoryCount');



    const directoryFilter =

        document.getElementById('roomDirectoryFilter');



    function renderRoomDirectory() {



        if (!directoryList || !directoryCount || !directoryFilter) {

            return;

        }



        const filter =

            directoryFilter.value

                .trim()

                .toLowerCase();

        const directoryEntries = Array.isArray(roomDirectory)
    ? roomDirectory
    : Array.isArray(roomDirectory?.rooms)
        ? roomDirectory.rooms
        : [];

const matches = directoryEntries.filter((entry) =>
    `${entry.section || ''} ${entry.floor || ''} ${entry.details || ''}`
        .toLowerCase()
        .includes(filter)
);

        directoryCount.textContent =

            `${matches.length} of ${directoryEntries.length} workbook entries`



        directoryList.innerHTML = '';



        matches.forEach((entry) => {



            const item =

                document.createElement('li');



            item.className =

                'directory-item';



            const heading =

                document.createElement('strong');



            heading.textContent =

                `${entry.section}${entry.floor ? ` - ${entry.floor}` : ''}`;



            item.appendChild(heading);



            item.append(

                document.createTextNode(entry.details)

            );



            item.addEventListener('click', () => {



                const searchInput =

                    document.getElementById('searchInput');



                if (searchInput) {

                    searchInput.value = entry.details;

                    ExecuteSearch();

                }

            });



            directoryList.appendChild(item);

        });

    }



    if (directoryFilter) {

        directoryFilter.addEventListener(

            'input',

            renderRoomDirectory

        );

    }



    renderRoomDirectory();



    // ============================================================

    // START / DESTINATION CONTROLS

    // ============================================================



    const endpointControls = {



        start: {

            floor:

                document.getElementById('startFloor'),



            building:

                document.getElementById('startBuilding'),



            room:

                document.getElementById('startRoom')

        },



        destination: {

            floor:

                document.getElementById('destinationFloor'),



            building:

                document.getElementById('destinationBuilding'),



            room:

                document.getElementById('destinationRoom')

        }

    };



    function nodeFloor(node) {



        if (!node) {

            return '0';

        }



        return String(

            node.meta?.floor ?? 0

        );

    }



    function fillOptions(

        select,

        options,

        placeholder

    ) {



        if (!select) {

            return;

        }



        select.innerHTML =

            `<option value="">${placeholder}</option>`;



        options.forEach(([value, label]) => {



            select.appendChild(

                new Option(label, value)

            );

        });

    }



    function updateEndpoint(

        endpoint,

        preferredId

    ) {



        const controls =

            endpointControls[endpoint];



        if (

            !controls.floor ||

            !controls.building ||

            !controls.room

        ) {

            return;

        }



        const floor =

            controls.floor.value;



        const buildings = [

            ...new Set(

                graphNodes

                    .filter(

                        node =>

                            !floor ||

                            nodeFloor(node) === floor

                    )

                    .map(

                        node =>

                            node.meta?.building

                    )

                    .filter(Boolean)

            )

        ];



        const selectedBuilding =

            buildings.includes(

                controls.building.value

            )

                ? controls.building.value

                : '';



        fillOptions(

            controls.building,



            buildings.map(

                building => [

                    building,

                    building

                ]

            ),



            'All buildings'

        );



        controls.building.value =

            selectedBuilding;



        const building =

            controls.building.value;



        const rooms =

            graphNodes.filter(

                node =>

                    (!floor ||

                        nodeFloor(node) === floor) &&

                    (!building ||

                        node.meta?.building === building)

            );



        fillOptions(

            controls.room,



            rooms.map(

                node => [

                    node.id,

                    node.name

                ]

            ),



            'Select room or location'

        );



        const nextId =

            rooms.some(

                node =>

                    node.id === preferredId

            )

                ? preferredId

                : rooms[0]?.id;



        if (nextId) {

            controls.room.value =

                nextId;

        }

    }



    function initializeEndpoint(

        endpoint,

        defaultId

    ) {



        const controls =

            endpointControls[endpoint];



        if (

            !controls.floor ||

            !controls.building ||

            !controls.room

        ) {

            return;

        }



        const floors = [

            ...new Set(

                graphNodes.map(nodeFloor)

            )

        ].sort(

            (a, b) =>

                Number(a) - Number(b)

        );



        fillOptions(

            controls.floor,



            floors.map(

                floor => [

                    floor,

                    floor === '0'

                        ? 'Ground Floor'

                        : `Level ${floor}`

                ]

            ),



            'All floors'

        );



        fillOptions(

            controls.building,



            [

                ...new Set(

                    graphNodes

                        .map(

                            node =>

                                node.meta?.building

                        )

                        .filter(Boolean)

                )

            ].map(

                building => [

                    building,

                    building

                ]

            ),



            'All buildings'

        );



        const defaultNode =

            graph.nodes[defaultId];



        if (!defaultNode) {

            return;

        }



        controls.floor.value =

            nodeFloor(defaultNode);



        controls.building.value =

            defaultNode.meta?.building || '';



        updateEndpoint(

            endpoint,

            defaultId

        );



        controls.floor.addEventListener(

            'change',

            () => updateEndpoint(endpoint)

        );



        controls.building.addEventListener(

            'change',

            () => updateEndpoint(endpoint)

        );

    }



    initializeEndpoint(

        'start',

        currentStartNodeId

    );



    initializeEndpoint(

        'destination',

        'node_canteen_hub'

    );



    // ============================================================

    // LIVE GPS CONTROLLER

    // ============================================================



    const useMyLocationBtn =

        document.getElementById('useMyLocationBtn');



    const startNavigationBtn =

        document.getElementById('startNavigationBtn');



    const currentPosText =

        document.getElementById('currentPosText');



    // Receive every real GPS update from MapEngine.

    window.addEventListener(

        'campus:navigation-update',

        event => {



            const detail = event.detail || {};



            if (

                typeof detail.lat !== 'number' ||

                typeof detail.lng !== 'number'

            ) {

                return;

            }



            currentGPSLocation = {

                latitude: detail.lat,

                longitude: detail.lng,

                accuracy: detail.accuracy,

                heading: detail.heading,

                speed: detail.speed

            };



            gpsNavigationActive = true;

            updateVoiceNavigation(detail);



            // The MapEngine already finds the nearest graph node.

            if (detail.nearestNode?.id) {

                currentStartNodeId = detail.nearestNode.id;

            } else {

                const nearestNode =

                    getNearestGraphNode(

                        detail.lat,

                        detail.lng

                    );



                if (nearestNode) {

                    currentStartNodeId = nearestNode.id;

                }

            }



            const nearestNode =

                graph.nodes[currentStartNodeId];



            if (currentPosText) {

                currentPosText.innerHTML =

                    `Current Position: <strong>LIVE GPS</strong><br>` +

                    `Nearest Campus Point: <strong>${

                        nearestNode?.name || 'Finding...'

                    }</strong><br>` +

                    `GPS Accuracy: <strong>${

                        Number.isFinite(detail.accuracy)

                            ? Math.round(detail.accuracy) + ' m'

                            : 'N/A'

                    }</strong>`;

            }



            if (useMyLocationBtn) {

                useMyLocationBtn.textContent =

                    '📍 Live GPS Active';

            }

        }

    );



    // GPS error handler.
    
    window.addEventListener(
    'campus:gps-error',
    
        event => {



            console.error(

                'LIVE GPS ERROR:',

                event.detail

            );



            if (useMyLocationBtn) {

                useMyLocationBtn.textContent =

                    '📍 Use My Location';

            }



            const error = event.detail;



            if (error?.code === 1) {

                alert(

                    'Location permission was denied. Allow location access for this site on your phone.'

                );

            } else {

                alert(

                    'Unable to get live GPS location. Please make sure GPS/location is enabled.'

                );

            }

        }

    );



    // ------------------------------------------------------------

    // USE MY LOCATION

    // ------------------------------------------------------------



    if (useMyLocationBtn) {



        useMyLocationBtn.addEventListener('click', () => {



            if (!navigator.geolocation) {

                alert(

                    'GPS is not supported by this browser.'

                );

                return;

            }



            useMyLocationBtn.textContent =

                '📍 Starting Live GPS...';



            // MapEngine contains the real watchPosition() logic.

            if (

                typeof mapModule.startLiveNavigation ===

                'function'

            ) {

                gpsNavigationActive = false;
                currentGPSLocation = null;

                mapModule.startLiveNavigation();

                return;

            }



            // Compatibility fallback if the loaded MapEngine does not

            // contain startLiveNavigation().

            navigator.geolocation.getCurrentPosition(

                position => {



                    const latitude =

                        position.coords.latitude;



                    const longitude =

                        position.coords.longitude;



                    const accuracy =

                        position.coords.accuracy;



                    currentGPSLocation = {

                        latitude,

                        longitude,

                        accuracy,

                        heading: position.coords.heading,

                        speed: position.coords.speed

                    };

                gpsNavigationActive = true;

                    const nearestNode =

                        getNearestGraphNode(

                            latitude,

                            longitude

                        );



                    if (nearestNode) {

                        currentStartNodeId =

                            nearestNode.id;

                    }



                    gpsNavigationActive = true;



                    if (

                        typeof mapModule.showUserLocation ===

                        'function'

                    ) {

                        mapModule.showUserLocation(

                            latitude,

                            longitude,

                            accuracy

                        );

                    }



                    if (currentPosText) {

                        currentPosText.innerHTML =

                            `Current Position: <strong>LIVE GPS</strong><br>` +

                            `Nearest Campus Point: <strong>${

                                nearestNode?.name || 'Unknown'

                            }</strong>`;

                    }



                    useMyLocationBtn.textContent =

                        '📍 Live GPS Active';

                },

                error => {

                    console.error(

                        'GPS Error:',

                        error

                    );



                    useMyLocationBtn.textContent =

                        '📍 Use My Location';



                    if (error.code === 1) {

                        alert(

                            'Location permission was denied. Please allow location access.'

                        );

                    } else {

                        alert(

                            'Unable to get your current location.'

                        );

                    }

                },

                {

                    enableHighAccuracy: true,

                    timeout: 15000,

                    maximumAge: 1000

                }

            );

        });

    }



    // ------------------------------------------------------------

    // START NAVIGATION BUTTON

    // ------------------------------------------------------------



    if (startNavigationBtn) {



        startNavigationBtn.addEventListener(

            'click',

            () => {



                if (!gpsNavigationActive || !currentGPSLocation) {

                    alert(
                        'Please click \"Use My Location\" and wait until LIVE GPS Active appears.'
                    );
                    return;
                }

                const destinationId =
                    endpointControls.destination.room?.value?.trim() || '';

                let targetNode = graph.nodes[destinationId];

                if (!targetNode && typeof resolveDirectoryRoom === 'function') {
                    targetNode = resolveDirectoryRoom(destinationId);
                }

                if (!targetNode) {
                    alert('Please select a valid destination room/location first.');
                    console.error('Destination could not be resolved:', {
                        destinationId,
                        building: endpointControls.destination.building?.value,
                        floor: endpointControls.destination.floor?.value
                    });
                    return;
                }

                const startNode =
                    graph.nodes[currentStartNodeId];

                if (!startNode) {
                    alert(
                        'Waiting for a valid GPS starting point. Keep GPS active for a few seconds.'
                    );
                    return;
                }



                // Store destination for MapEngine arrival detection.

                mapModule.navigationDestination =

                    targetNode;



                // Calculate/draw the route.

                renderRoute(

                    startNode,

                    targetNode

                );



                // drawPathLine() in the current MapEngine already starts

                // real-time GPS. Start it explicitly as well only if needed.

                if (

                    typeof mapModule.startLiveNavigation ===

                    'function' &&

                    !mapModule.navigationActive

                ) {

                    mapModule.startLiveNavigation();

                }



                startNavigationBtn.textContent =

                    '🧭 Live Navigation Active';



                console.log(

                    'LIVE NAVIGATION STARTED'

                );

            }

        );

    }



    // ------------------------------------------------------------

    // ARRIVAL EVENT

    // ------------------------------------------------------------



    window.addEventListener(

        'campus:destination-reached',

        event => {



            const destination =

                event.detail?.destination;



            if (startNavigationBtn) {

                startNavigationBtn.textContent =

                    '✅ Arrived at Destination';

            }



            const arrivalMessage =
                `You have reached ${
                    destination?.meta?.roomNumber ||
                    destination?.name ||
                    'your destination'
                }. Navigation complete.`;

            speakNavigation(arrivalMessage, 'arrival');
            activeVoiceRoute = [];
            alert(arrivalMessage);

        }

    );



    // ============================================================

    // MAP STYLE

    // ============================================================



    document

        .querySelectorAll('.style-btn')

        .forEach(button => {



            button.addEventListener(

                'click',

                () => {



                    if (

                        typeof mapModule.setMapStyle ===

                        'function'

                    ) {

                        mapModule.setMapStyle(

                            button.dataset.style

                        );

                    }



                    document

                        .querySelectorAll('.style-btn')

                        .forEach(item =>

                            item.classList.remove(

                                'active'

                            )

                        );



                    button.classList.add(

                        'active'

                    );

                }

            );

        });



    // ============================================================

    // LOGIN

    // ============================================================



    const roleCredentials = {



        parent: {

            id: 'MBU-PARENT-2026',

            pin: '9999',

            label: 'Parent'

        },



        student: {

            id: 'MBU-STUDENT-2026',

            pin: '1111',

            label: 'Student'

        },



        faculty: {

            id: 'MBU-FACULTY-2026',

            pin: '2222',

            label: 'Faculty Member'

        },



        visitor: {

            id: 'MBU-VISITOR-2026',

            pin: '3333',

            label: 'Campus Visitor'

        },



        admin: {

            id: 'MBU-ADMIN-2026',

            pin: '4444',

            label: 'System Administrator'

        }

    };



    const submitAuthBtn =

        document.getElementById(

            'submitAuthBtn'

        );



    if (submitAuthBtn) {



        submitAuthBtn.addEventListener(

            'click',

            () => {



                const selectedRole =

                    document.getElementById(

                        'userRole'

                    )?.value;



                const enteredId =

                    document.getElementById(

                        'uid'

                    )?.value

                        .trim()

                        .toUpperCase();



                const enteredPin =

                    document.getElementById(

                        'pwd'

                    )?.value

                        .trim();



                const expected =

                    roleCredentials[

                        selectedRole

                    ];



                const errorMessage =

                    document.getElementById(

                        'loginErrorMsg'

                    );



                if (

                    !expected ||

                    enteredId !== expected.id ||

                    enteredPin !== expected.pin

                ) {



                    if (errorMessage) {

                        errorMessage.textContent =

                            `Invalid ${

                                expected?.label ||

                                'role'

                            } credentials.`;



                        errorMessage.style.display =

                            'block';

                    }



                    const pwd =

                        document.getElementById(

                            'pwd'

                        );



                    if (pwd) {

                        pwd.value = '';

                    }



                    return;

                }



                if (errorMessage) {

                    errorMessage.style.display =

                        'none';

                }



                const loginOverlay =

                    document.getElementById(

                        'loginOverlay'

                    );



                if (loginOverlay) {

                    loginOverlay.style.display =

                        'none';

                }

            }

        );

    }



    const passwordInput =

        document.getElementById('pwd');



    if (passwordInput) {



        passwordInput.addEventListener(

            'keydown',

            event => {



                if (event.key === 'Enter') {



                    submitAuthBtn?.click();

                }

            }

        );

    }



    // ============================================================

    // QR SIMULATOR

    // ============================================================



    const qrSimulate =

        document.getElementById(

            'qrSimulate'

        );



    if (qrSimulate) {



        qrSimulate.addEventListener(

            'change',

            event => {



                if (!event.target.value) {

                    return;

                }



                currentStartNodeId =

                    event.target.value;



                const node =

                    graph.nodes[

                        currentStartNodeId

                    ];



                if (!node) {

                    return;

                }



                if (

                    typeof mapModule.flyToLocation ===

                    'function'

                ) {

                    mapModule.flyToLocation(

                        node.lat,

                        node.lng,

                        19

                    );

                }



                const currentPosText =

                    document.getElementById(

                        'currentPosText'

                    );



                if (currentPosText) {



                    currentPosText.innerHTML =

                        `Current Position: <strong>${node.name}</strong>`;

                }



                analytics.trackInteraction(

                    currentStartNodeId,

                    'qr_scan'

                );

            }

        );

    }



    // ============================================================

    // SEARCH

    // ============================================================



    function ExecuteSearch() {



        const searchInput =

            document.getElementById(

                'searchInput'

            );



        if (!searchInput) {

            return;

        }



        const query =

            searchInput.value.trim();



        if (!query) {

            return;

        }



        const isRoomNumber =

            /^\s*\d{3,4}(?:[ -]?[A-Z])?\s*$/i

                .test(query);



        const targetNode =

            isRoomNumber

                ? resolveDirectoryRoom(query)

                : searchEngine.findBestMatch(query);

        // LIVE GPS MUST BE ACTIVE
if(gpsNavigationActive || !currentGPSLocation) {
    alert('Please click "Use My Location" first.');
    return;
}

        if (!targetNode) {



            alert(

                'Location not found. Please enter a valid room number or campus location.'

            );



            return;

        }

        console.log("ROOM FOUND:", targetNode);


        const startNode =

            graph.nodes[

                currentStartNodeId

            ];



        if (!startNode) {



            alert(

                'Starting location could not be found.'

            );



            return;

        }



        analytics.trackInteraction(

            targetNode.id,

            'search_request'

        );

        // Save destination for live arrival detection
mapModule.navigationDestination = targetNode;

// Show GPS start and room destination
const currentPosText =
    document.getElementById('currentPosText');

if (currentPosText) {
    currentPosText.innerHTML =
        `Current Position: <strong>LIVE GPS</strong><br>` +
        `Route Start: <strong>${startNode.name}</strong><br>` +
        `Destination: <strong>${
            targetNode.meta?.roomNumber || targetNode.name
        }</strong>`;
}



        renderRoute(

            startNode,

            targetNode

        );

    }
    if (
    typeof mapModule.startLiveNavigation === 'function' &&
    !mapModule.navigationActive
) {
    mapModule.startLiveNavigation();
}



    const searchBtn =

        document.getElementById(

            'searchBtn'

        );



    if (searchBtn) {

        searchBtn.addEventListener(

            'click',

            ExecuteSearch

        );

    }



    const searchInput =

        document.getElementById(

            'searchInput'

        );



    if (searchInput) {



        searchInput.addEventListener(

            'keydown',

            event => {



                if (event.key === 'Enter') {

                    ExecuteSearch();

                }

            }

        );

    }



    // ============================================================

    // ROUTE BUTTON - LIVE GPS AS START

    // ============================================================



    const selectRouteBtn =

        document.getElementById('selectRouteBtn');



    if (selectRouteBtn) {



        selectRouteBtn.addEventListener('click', () => {



            // LIVE GPS MUST BE ACTIVE

            if (!gpsNavigationActive || !currentGPSLocation) {

                alert(

                    'Please click "Use My Location" first and wait for the GPS location.'

                );

                return;

            }



            const destinationId =
                endpointControls.destination.room?.value?.trim() || '';

            let targetNode = graph.nodes[destinationId];

            if (!targetNode && typeof resolveDirectoryRoom === 'function') {
                targetNode = resolveDirectoryRoom(destinationId);
            }

            if (!targetNode) {
                alert('Please select a valid destination.');
                return;
            }



            // The GPS event continuously updates this nearest graph node.

            const startNode =

                graph.nodes[currentStartNodeId];



            if (!startNode) {

                alert(

                    'Could not find a campus route point near your live GPS location.'

                );

                return;

            }



            // Save the destination for real-time arrival detection.

            if (

                typeof mapModule.setNavigationDestination === 'function'

            ) {

                mapModule.setNavigationDestination(targetNode);

            } else {

                // Current MapEngine saves this automatically when drawPathLine()

                // is called, so this is only a compatibility fallback.

                mapModule.navigationDestination = targetNode;

            }



            const currentPosText =

                document.getElementById('currentPosText');



            if (currentPosText) {

                currentPosText.innerHTML =

                    `Current Position: <strong>LIVE GPS</strong><br>` +

                    `Route Start: <strong>${startNode.name}</strong><br>` +

                    `Destination: <strong>${targetNode.name}</strong>`;

            }



            renderRoute(startNode, targetNode);



            console.log('LIVE GPS ROUTE START:', {

                latitude: currentGPSLocation.latitude,

                longitude: currentGPSLocation.longitude,

                nearestNode: startNode.name,

                destination: targetNode.name

            });

        });

    }



    // ============================================================

    // RENDER ROUTE

    // ============================================================



    function renderRoute(

        startNode,

        targetNode

    ) {



        if (

            !startNode ||

            !targetNode

        ) {



            alert(

                'Please select a valid starting location and destination.'

            );



            return;

        }



        // --------------------------------------------------------

        // ROUTE FILTERS

        // --------------------------------------------------------



        const wheelchairFilter =

            document.getElementById(

                'wheelchairFilter'

            );



        const crowdFilter =

            document.getElementById(

                'avoidCrowdFilter'

            );



        const demandsWheelchair =

            wheelchairFilter

                ? wheelchairFilter.checked

                : false;



        const avoidsCrowds =

            crowdFilter

                ? crowdFilter.checked

                : false;



        // --------------------------------------------------------

        // CALCULATE ROUTE

        // --------------------------------------------------------



        let navigationResult;



        try {



            navigationResult =

                router.computePath(

                    startNode.id,

                    targetNode.id,

                    {

                        wheelchair:

                            demandsWheelchair,



                        crowded:

                            avoidsCrowds

                    }

                );



        } catch (error) {



            console.error(

                'Route calculation error:',

                error

            );



            alert(

                'Unable to calculate the route. Check the campus graph and router.'

            );



            return;

        }



        // --------------------------------------------------------

        // ROUTE FAILURE

        // --------------------------------------------------------



        if (

            !navigationResult ||

            !navigationResult.success

        ) {



            alert(

                'No accessible route found matching your current priority constraints.'

            );



            return;

        }



        // --------------------------------------------------------

        // VOICE ROUTE + TRUE GPS START POINT
        // --------------------------------------------------------
        let routeCoordinates = Array.isArray(navigationResult.coordinates)
            ? [...navigationResult.coordinates]
            : [];

        if (
            currentGPSLocation &&
            Number.isFinite(currentGPSLocation.latitude) &&
            Number.isFinite(currentGPSLocation.longitude) &&
            routeCoordinates.length > 0
        ) {
            const gpsPoint = [
                currentGPSLocation.latitude,
                currentGPSLocation.longitude
            ];
            const firstPoint = getRoutePoint(routeCoordinates[0]);

            if (
                !firstPoint ||
                geoDistanceMeters(
                    gpsPoint[0],
                    gpsPoint[1],
                    firstPoint.lat,
                    firstPoint.lng
                ) > 3
            ) {
                routeCoordinates.unshift(gpsPoint);
            }
        }

        resetVoiceNavigation(routeCoordinates);
        speakNavigation(
            `Navigation started to ${targetNode.meta?.roomNumber || targetNode.name}.`
        );

        if (typeof mapModule.drawPathLine === 'function') {
            mapModule.drawPathLine(
                routeCoordinates,
                startNode,
                targetNode
            );
        }

        // --------------------------------------------------------

        // ROUTE DETAILS

        // --------------------------------------------------------



        const routeDetailsCard =

            document.getElementById(

                'routeDetailsCard'

            );



        if (routeDetailsCard) {

            routeDetailsCard.classList.remove(

                'hidden'

            );

        }



        // --------------------------------------------------------

        // DISTANCE

        // --------------------------------------------------------



        const pathDist =

            document.getElementById(

                'pathDist'

            );



        const distance =

            Number(

                navigationResult.totalDistance

            ) || 0;



        if (pathDist) {



            pathDist.textContent =

                `${Math.round(distance)} meters`;

        }



        // --------------------------------------------------------

        // TIME

        // --------------------------------------------------------



        const pathTime =

            document.getElementById(

                'pathTime'

            );



        if (pathTime) {



            const minutes =

                Math.max(

                    1,

                    Math.ceil(

                        distance /

                        1.2 /

                        60

                    )

                );



            pathTime.textContent =

                `${minutes} mins`;

        }



        // --------------------------------------------------------

        // DIRECTIONS

        // --------------------------------------------------------



        const directionsList =

            document.getElementById(

                'directionsList'

            );



        if (directionsList) {



            const directions =

                Array.isArray(

                    navigationResult.directions

                )

                    ? navigationResult.directions

                    : [];



            directionsList.innerHTML =

                directions

                    .map(

                        direction =>

                            `<li>${direction}</li>`

                    )

                    .join('');

        }



        // --------------------------------------------------------

        // EXPLAINABLE AI

        // --------------------------------------------------------



        const xaiExplanation =

            document.getElementById(

                'xaiExplanation'

            );



        if (xaiExplanation) {



            const explanation =

                navigationResult.explanation ||

                "The route was calculated using the campus navigation graph and Dijkstra's shortest-path algorithm.";



            xaiExplanation.innerHTML =

                `<strong>Explainable AI Reasoning:</strong> ${explanation}`;

        }



        // --------------------------------------------------------

        // DESTINATION INFORMATION

        // --------------------------------------------------------



        const meta =

            targetNode.meta || {};



        const roomNumber =

            meta.roomNumber ||

            targetNode.name ||

            'Unknown';



        const building =

            meta.building ||

            'MBU Facility Block';



        let floorLabel =

            'Ground Floor';



        if (meta.floorLabel) {



            floorLabel =

                meta.floorLabel;



        } else if (

            meta.floor !== undefined &&

            meta.floor !== null

        ) {



            floorLabel =

                Number(meta.floor) === 0

                    ? 'Ground Floor'

                    : `Level ${meta.floor}`;

        }



        const roomMatrixInfo =

            document.getElementById(

                'roomMatrixInfo'

            );



        if (roomMatrixInfo) {



            roomMatrixInfo.innerHTML =

                `<strong>Destination Address</strong><br><br>` +

                `<strong>Room:</strong> ${roomNumber}<br><br>` +

                `<strong>Block:</strong> ${building}<br><br>` +

                `<strong>Floor:</strong> ${floorLabel}`;

        }



        // --------------------------------------------------------

        // ANALYTICS

        // --------------------------------------------------------



        if (

            analytics &&

            typeof analytics.renderHotspots ===

            'function'

        ) {



            analytics.renderHotspots();

        }



        if (

            analytics &&

            typeof analytics.trackInteraction ===

            'function'

        ) {



            analytics.trackInteraction(

                targetNode.id,

                'route_calculated'

            );

        }



        // --------------------------------------------------------

        // DEBUG

        // --------------------------------------------------------



        console.log(

            'Route calculated successfully'

        );



        console.log(

            'Start:',

            startNode.name

        );



        console.log(

            'Destination:',

            targetNode.name

        );



        console.log(

            'Distance:',

            navigationResult.totalDistance

        );



        console.log(

            'Directions:',

            navigationResult.directions

        );

    }




    setTimeout(() => {
        speakNavigation('Welcome to Campus Horizon. Voice navigation is ready.');
    }, 700);

});