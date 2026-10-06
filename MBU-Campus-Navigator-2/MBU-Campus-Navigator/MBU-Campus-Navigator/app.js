import { MapEngine } from './modules/mapEngine.js';
import { RouterEngine } from './modules/router.js';
import { SemanticSearch } from './modules/search.js';
import { AnalyticsEngine } from './modules/analytics.js';
import { roomDirectory } from './modules/roomDirectory.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map Canvas Centered on MBU Tirupati
    const mapModule = new MapEngine('map');
    const graph = mapModule.getCampusGraph();
    
    // 2. Initialize Core Logic Systems
    const router = new RouterEngine(graph);
    const searchEngine = new SemanticSearch(graph);
    const analytics = new AnalyticsEngine();

    // State Variables - Defaulting to Main Gate on startup
    let currentStartNodeId = "node_main_gate_checkpoint"; 
    const graphNodes = Object.values(graph.nodes);

    const directoryRoomAnchors = [
        { pattern: /PARMACUTICAL/i, nodeId: 'node_pharmaceutical_entrance' },
        { pattern: /VALMAR/i, nodeId: 'node_valmar_b1_gf' },
        { pattern: /MNS/i, nodeId: 'node_m_block_foyer' },
        { pattern: /G\s*-\s*BLOCK/i, nodeId: 'node_unnamed_glass_building' }
    ];

    function getDirectoryRoomLocation(roomNumber, directoryEntry) {
        const number = Number(roomNumber);
        const floorName = (floorIndex) => floorIndex === 0 ? 'Ground Floor' : `${floorIndex}${floorIndex === 1 ? 'st' : floorIndex === 2 ? 'nd' : floorIndex === 3 ? 'rd' : 'th'} Floor`;
        if (number >= 1401 && number <= 1612) {
            return { building: 'Pharmaceutical Block', floor: number < 1500 ? 'Ground Floor' : number < 1600 ? '1st Floor' : '2nd Floor', anchorId: 'node_pharmaceutical_entrance' };
        }
        if (number >= 401 && number <= 825) {
            return { building: 'MNS Block - U-Shaped', floor: number < 500 ? 'Ground Floor' : number < 600 ? '1st Floor' : number < 700 ? '2nd Floor' : number < 800 ? '3rd Floor' : '4th Floor', anchorId: 'node_m_block_foyer' };
        }
        if (number >= 4000 && number <= 4524) {
            return { building: 'G-Block', floor: number < 4100 ? 'Ground Floor' : number < 4200 ? '1st Floor' : number < 4300 ? '2nd Floor' : number < 4400 ? '3rd Floor' : number < 4500 ? '4th Floor' : '5th Floor', anchorId: 'node_unnamed_glass_building' };
        }
        if (number >= 2500 && number < 2900) {
            return { building: 'Mechanical Block', floor: floorName(Math.floor(number / 100) - 25), anchorId: 'node_m_block_foyer' };
        }
        if (number >= 1700 && number < 2100) {
            return { building: 'Degree Block', floor: floorName(Math.floor(number / 100) - 17), anchorId: 'node_m_block_foyer' };
        }
        if (number >= 2100 && number < 2500) {
            return { building: 'Civil Block', floor: floorName(Math.floor(number / 100) - 21), anchorId: 'node_m_block_foyer' };
        }
        if (number >= 100 && number < 200) {
            return { building: number < 110 ? 'West Block' : number < 124 ? 'South Block' : 'East Block', floor: 'Ground Floor', anchorId: 'node_unnamed_glass_building' };
        }
        if (number >= 200 && number < 300) {
            return { building: number < 212 ? 'West Block' : number < 219 ? 'South Block' : 'East Block', floor: '1st Floor', anchorId: 'node_unnamed_glass_building' };
        }
        if (number >= 300 && number < 400) {
            return { building: number < 315 ? 'West Block' : number < 320 ? 'South Block' : 'East Block', floor: '2nd Floor', anchorId: 'node_unnamed_glass_building' };
        }
        const anchor = directoryRoomAnchors.find(({ pattern }) => pattern.test(directoryEntry.section));
        return { building: directoryEntry.section, floor: directoryEntry.floor || 'Ground Floor', anchorId: anchor?.nodeId || 'node_canteen_hub' };
    }

    function resolveDirectoryRoom(rawQuery) {
        const query = rawQuery.trim().toUpperCase().replace(/\s+/g, '');
        const roomMatch = query.match(/^(\d{3,4})-?([A-Z])?$/);
        if (!roomMatch) return null;

        const [, roomNumber, roomSuffix = ''] = roomMatch;
        const roomPattern = new RegExp(`(^|[^0-9])${roomNumber}(?:[- ]?${roomSuffix})?([^0-9]|$)`, 'i');
        const directoryEntry = roomDirectory.find((entry) => roomPattern.test(entry.details));
        if (!directoryEntry) return null;

        const location = getDirectoryRoomLocation(roomNumber, directoryEntry);
        const anchorNode = graph.nodes[location.anchorId];
        if (!anchorNode) return null;

        const nodeId = `directory_room_${roomNumber}${roomSuffix}`;
        if (!graph.nodes[nodeId]) {
            graph.nodes[nodeId] = {
                id: nodeId,
                name: `Room ${roomNumber}${roomSuffix} - ${directoryEntry.section} entrance`,
                lat: anchorNode.lat,
                lng: anchorNode.lng,
                type: 'classroom',
                tags: [roomNumber, `${roomNumber}${roomSuffix}`],
                meta: {
                    floor: location.floor,
                    floorLabel: location.floor,
                    building: location.building,
                    roomNumber: `${roomNumber}${roomSuffix}`,
                    directorySource: 'CAMPUS_ROOMNUMBERS_latest.xlsx',
                    directoryAnchor: anchorNode.name
                }
            };
            graph.edges.push({
                from: anchorNode.id,
                to: nodeId,
                weight: 1,
                structuralSteps: false,
                defaultCrowdDensity: 1
            });
        }

        return graph.nodes[nodeId];
    }

    // Render initial layers and data lists
    mapModule.renderGraphNodes();
    analytics.renderHotspots();

    const directoryList = document.getElementById('roomDirectoryList');
    const directoryCount = document.getElementById('directoryCount');
    const directoryFilter = document.getElementById('roomDirectoryFilter');

    function renderRoomDirectory() {
        const filter = directoryFilter.value.trim().toLowerCase();
        const matches = roomDirectory.filter((entry) => (
            `${entry.section} ${entry.floor} ${entry.details}`.toLowerCase().includes(filter)
        ));
        directoryCount.textContent = `${matches.length} of ${roomDirectory.length} workbook entries`;
        directoryList.innerHTML = '';
        matches.forEach((entry) => {
            const item = document.createElement('li');
            item.className = 'directory-item';
            const heading = document.createElement('strong');
            heading.textContent = `${entry.section}${entry.floor ? ` - ${entry.floor}` : ''}`;
            item.appendChild(heading);
            item.append(entry.details);
            item.addEventListener('click', () => {
                document.getElementById('searchInput').value = entry.details;
                ExecuteSearch();
            });
            directoryList.appendChild(item);
        });
    }

    directoryFilter.addEventListener('input', renderRoomDirectory);
    renderRoomDirectory();

    const endpointControls = {
        start: {
            floor: document.getElementById('startFloor'),
            building: document.getElementById('startBuilding'),
            room: document.getElementById('startRoom')
        },
        destination: {
            floor: document.getElementById('destinationFloor'),
            building: document.getElementById('destinationBuilding'),
            room: document.getElementById('destinationRoom')
        }
    };

    function nodeFloor(node) {
        return String(node.meta?.floor ?? 0);
    }

    function fillOptions(select, options, placeholder) {
        select.innerHTML = `<option value="">${placeholder}</option>`;
        options.forEach(([value, label]) => {
            select.appendChild(new Option(label, value));
        });
    }

    function updateEndpoint(endpoint, preferredId) {
        const controls = endpointControls[endpoint];
        const floor = controls.floor.value;
        const buildings = [...new Set(graphNodes
            .filter((node) => !floor || nodeFloor(node) === floor)
            .map((node) => node.meta?.building)
            .filter(Boolean))];
        const selectedBuilding = buildings.includes(controls.building.value) ? controls.building.value : '';
        fillOptions(controls.building, buildings.map((building) => [building, building]), 'All buildings');
        controls.building.value = selectedBuilding;
        const building = controls.building.value;
        const rooms = graphNodes.filter((node) => (
            (!floor || nodeFloor(node) === floor) &&
            (!building || node.meta?.building === building)
        ));
        fillOptions(controls.room, rooms.map((node) => [node.id, node.name]), 'Select room or location');
        const nextId = rooms.some((node) => node.id === preferredId) ? preferredId : rooms[0]?.id;
        if (nextId) controls.room.value = nextId;
    }

    function initializeEndpoint(endpoint, defaultId) {
        const controls = endpointControls[endpoint];
        const floors = [...new Set(graphNodes.map(nodeFloor))].sort((a, b) => Number(a) - Number(b));
        fillOptions(controls.floor, floors.map((floor) => [floor, floor === '0' ? 'Ground Floor' : `Level ${floor}`]), 'All floors');
        fillOptions(controls.building, [...new Set(graphNodes.map((node) => node.meta?.building).filter(Boolean))].map((building) => [building, building]), 'All buildings');
        const defaultNode = graph.nodes[defaultId];
        controls.floor.value = nodeFloor(defaultNode);
        controls.building.value = defaultNode.meta?.building || '';
        updateEndpoint(endpoint, defaultId);
        controls.floor.addEventListener('change', () => updateEndpoint(endpoint));
        controls.building.addEventListener('change', () => updateEndpoint(endpoint));
    }

    initializeEndpoint('start', currentStartNodeId);
    initializeEndpoint('destination', 'node_canteen_hub');

    document.querySelectorAll('.style-btn').forEach((button) => {
        button.addEventListener('click', () => {
            mapModule.setMapStyle(button.dataset.style);
            document.querySelectorAll('.style-btn').forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
        });
    });

    const roleCredentials = {
        parent: { id: 'MBU-PARENT-2026', pin: '9999', label: 'Parent' },
        student: { id: 'MBU-STUDENT-2026', pin: '1111', label: 'Student' },
        faculty: { id: 'MBU-FACULTY-2026', pin: '2222', label: 'Faculty Member' },
        visitor: { id: 'MBU-VISITOR-2026', pin: '3333', label: 'Campus Visitor' },
        admin: { id: 'MBU-ADMIN-2026', pin: '4444', label: 'System Administrator' }
    };

    // Authentication requires credentials assigned to the selected role.
    document.getElementById('submitAuthBtn').addEventListener('click', () => {
        const selectedRole = document.getElementById('userRole').value;
        const enteredId = document.getElementById('uid').value.trim().toUpperCase();
        const enteredPin = document.getElementById('pwd').value.trim();
        const expected = roleCredentials[selectedRole];
        const errorMessage = document.getElementById('loginErrorMsg');

        if (!expected || enteredId !== expected.id || enteredPin !== expected.pin) {
            errorMessage.textContent = `Invalid ${expected?.label || 'role'} credentials. Use the ID and PIN assigned to the selected role.`;
            errorMessage.style.display = 'block';
            document.getElementById('pwd').value = '';
            return;
        }

        errorMessage.style.display = 'none';
        document.getElementById('loginOverlay').style.display = 'none';
    });

    document.getElementById('pwd').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') document.getElementById('submitAuthBtn').click();
    });

    // 3. Handle Simulator QR Code Position Synchronization
    document.getElementById('qrSimulate').addEventListener('change', (e) => {
        if (e.target.value) {
            currentStartNodeId = e.target.value;
            const node = graph.nodes[currentStartNodeId];
            mapModule.flyToLocation(node.lat, node.lng, 19);
            document.getElementById('currentPosText').innerHTML = `Current Position: <strong>${node.name}</strong>`;
            analytics.trackInteraction(currentStartNodeId, 'qr_scan');
        }
    });

    // 4. Handle Semantic AI Processing
    document.getElementById('searchBtn').addEventListener('click', ExecuteSearch);
    document.getElementById('selectRouteBtn').addEventListener('click', () => {
        const startNode = graph.nodes[endpointControls.start.room.value];
        const targetNode = graph.nodes[endpointControls.destination.room.value];
        if (!startNode || !targetNode) return;
        currentStartNodeId = startNode.id;
        document.getElementById('currentPosText').innerHTML = `Current Position: <strong>${startNode.name}</strong>`;
        renderRoute(startNode, targetNode);
    });
    document.getElementById('searchInput').addEventListener('keypress', (e) => { if(e.key === 'Enter') ExecuteSearch(); });

    function ExecuteSearch() {
        const query = document.getElementById('searchInput').value;
        if (!query.trim()) return;

        const isRoomNumber = /^\s*\d{3,4}(?:[ -]?[A-Z])?\s*$/i.test(query);
        const targetNode = isRoomNumber
            ? resolveDirectoryRoom(query)
            : searchEngine.findBestMatch(query);
        if (!targetNode) {
            alert("Room number not found. Please enter a room number listed in the campus directory.");
            return;
        }
        
        analytics.trackInteraction(targetNode.id, 'search_request');
        renderRoute(graph.nodes[currentStartNodeId], targetNode);
    }

    function renderRoute(startNode, targetNode) {
        if (!startNode || !targetNode) return;

        // Extract modifiers for route filtering from toggles
        const demandsWheelchair = document.getElementById('wheelchairFilter').checked;
        const avoidsCrowds = document.getElementById('avoidCrowdFilter').checked;

        // Compute AI Optimal Path
        const navigationResult = router.computePath(startNode.id, targetNode.id, {
            wheelchair: demandsWheelchair,
            crowded: avoidsCrowds
        });

        if (navigationResult.success) {
            // Draw navigation path tracking line on layout
            mapModule.drawPathLine(navigationResult.coordinates, startNode, targetNode);
            
            // Present UI Data and reveal information stats board
            document.getElementById('routeDetailsCard').classList.remove('hidden');
            document.getElementById('pathDist').textContent = `${navigationResult.totalDistance} meters`;
            document.getElementById('pathTime').textContent = `${Math.ceil(navigationResult.totalDistance / 1.2 / 60)} mins`;
            document.getElementById('directionsList').innerHTML = navigationResult.directions
                .map((direction) => `<li>${direction}</li>`)
                .join('');
            
            // Render Explainable AI Output Text
            document.getElementById('xaiExplanation').innerHTML = `<strong>Explainable AI Reasoning:</strong> ${navigationResult.explanation}`;
            
            const floorLabel = targetNode.meta.floorLabel || (targetNode.meta.floor === 0 ? 'Ground Floor' : `Level ${targetNode.meta.floor}`);
            document.getElementById('roomMatrixInfo').innerHTML = `
                <strong>Destination Address</strong><br>
                Room: ${targetNode.meta.roomNumber || targetNode.name}<br>
                Block: ${targetNode.meta.building || 'MBU Facility Block'}<br>
                Floor: ${floorLabel}
            `;
        } else {
            alert("No accessible route found matching your current priority constraints.");
        }
        analytics.renderHotspots();
    }
});
