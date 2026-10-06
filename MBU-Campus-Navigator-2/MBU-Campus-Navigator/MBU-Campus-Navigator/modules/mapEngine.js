export class MapEngine {
    constructor(elementId) {
        // Set viewport directly over Mohan Babu University (MBU), Tirupati
        this.map = L.map(elementId).setView([13.6200, 79.2903], 17);
        
        this.standardLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap | MBU Location Intelligence Engine'
        }).addTo(this.map);
        this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles © Esri'
        });
        
        this.pathLayer = L.layerGroup().addTo(this.map);
        this.routeMarkerLayer = L.layerGroup().addTo(this.map);

        // Core Topological Graph of MBU
        this.campusGraph = {
            nodes: {
                "node_main_gate_checkpoint": { "id": "node_main_gate_checkpoint", "name": "MBU Main Gate Security Hub", "lat": 13.619100, "lng": 79.289500, "type": "gate", "tags": ["entrance", "security", "pass", "visitor register", "bouncers"], "meta": { "floor": 0, "building": "Main Arch Entrance" } },
                "node_pedestrian_side_gate": { "id": "node_pedestrian_side_gate", "name": "MBU Pedestrian Side Gate (Hut Backside)", "lat": 13.619080, "lng": 79.289540, "type": "gate", "tags": ["small gate", "pedestrian entrance", "hut backside", "right side"], "meta": { "floor": 0, "building": "Main Arch Entrance Complex" } },
                "node_lotus_park_lawn": { "id": "node_lotus_park_lawn", "name": "MBU Lotus Pond Front Park Lawn", "lat": 13.619220, "lng": 79.289430, "type": "landmark", "tags": ["park", "greenery", "grass lawn", "lotus pond front", "garden"], "meta": { "floor": 0, "building": "Exterior Complex" } },
                "node_entry_avenue_split": { "id": "node_entry_avenue_split", "name": "Main Avenue Traffic Split", "lat": 13.619350, "lng": 79.289720, "type": "intersection", "tags": ["fork road", "junction", "split lane"], "meta": { "floor": 0, "building": "Exterior Complex" } },
                "node_left_parking_zone": { "id": "node_left_parking_zone", "name": "MBU Left Wing Parking Area", "lat": 13.619550, "lng": 79.289350, "type": "parking", "tags": ["car parking", "bike parking"], "meta": { "floor": 0, "building": "Exterior Complex" } },
                "node_front_pond_junction": { "id": "node_front_pond_junction", "name": "Lotus Pond Front Crossroads", "lat": 13.619250, "lng": 79.289650, "type": "intersection", "tags": ["pond crossroads", "connecting route"], "meta": { "floor": 0, "building": "Exterior Complex" } },
                "node_right_parking_zone": { "id": "node_right_parking_zone", "name": "MBU Right Wing Parking Lot", "lat": 13.619280, "lng": 79.289950, "type": "parking", "tags": ["right parking", "staff parking"], "meta": { "floor": 0, "building": "Exterior Complex" } },
                "node_west_phase_gate": { "id": "node_west_phase_gate", "name": "MBU West Phase Gate Entrance", "lat": 13.619050, "lng": 79.289900, "type": "gate", "tags": ["west gate", "west phase gate", "secondary entry"], "meta": { "floor": 0, "building": "Exterior Perimeter Complex" } },
                "node_right_bypass_road_junction": { "id": "node_right_bypass_road_junction", "name": "West Phase to M-Block Connection Junction", "lat": 13.619450, "lng": 79.290200, "type": "intersection", "tags": ["bypass road", "right connecting road"], "meta": { "floor": 0, "building": "Exterior Complex" } },
                
                // M-BLOCK
                "node_m_block_front_plaza": { "id": "node_m_block_front_plaza", "name": "M-Block Main Front Arch Plaza", "lat": 13.619810, "lng": 79.290050, "type": "landmark", "tags": ["m block front", "plaza", "m shape center"], "meta": { "floor": 0, "building": "M-Block" } },
                "node_m_block_foyer": { "id": "node_m_block_foyer", "name": "M-Block Foyer (M-Shape Main Engineering Hub)", "lat": 13.619850, "lng": 79.290100, "type": "entrance", "tags": ["m block", "engineering block"], "meta": { "floor": 0, "building": "M-Block" } },
                "node_m_block_hq_restricted": { "id": "node_m_block_hq_restricted", "name": "M-Block Executive Leadership Wings (Restricted Access Zone)", "lat": 13.619900, "lng": 79.290150, "type": "restricted", "tags": ["mohan babu office", "vishnu manchu office", "no entry"], "meta": { "floor": 1, "building": "M-Block Center Wing" } },
                
                // CANTEEN & VALMAR
                "node_canteen_hub": { "id": "node_canteen_hub", "name": "MBU Central Campus Canteen & Cafeteria", "lat": 13.619500, "lng": 79.290500, "type": "landmark", "tags": ["canteen", "cafeteria", "food court", "lunch hall"], "meta": { "floor": 0, "building": "Central Canteen Block" } },
                "node_canteen_mblock_junction": { "id": "node_canteen_mblock_junction", "name": "M-Block Avenue & Canteen Loop Intersection", "lat": 13.619700, "lng": 79.290350, "type": "intersection", "tags": ["canteen junction", "m-block loop split"], "meta": { "floor": 0, "building": "Exterior Complex" } },
                "node_unnamed_glass_building": { "id": "node_unnamed_glass_building", "name": "The Glass Facade Structure (Unassigned Block)", "lat": 13.619620, "lng": 79.290250, "type": "landmark", "tags": ["glass building", "mirror building", "empty block"], "meta": { "floor": 0, "building": "Unknown Complex Sector" } },
                "node_valmar_east_road": { "id": "node_valmar_east_road", "name": "Valmar Office East Approach Road", "lat": 13.619400, "lng": 79.290800, "type": "intersection", "tags": ["valmar road", "east phase road"], "meta": { "floor": 0, "building": "Exterior Perimeter" } },
                "node_valmar_b1_gf": { "id": "node_valmar_b1_gf", "name": "College Admissions Cell (Valmar Bldg 1 - GF)", "lat": 13.619420, "lng": 79.290900, "type": "classroom", "tags": ["college admissions", "new admissions", "join college"], "meta": { "floor": 0, "building": "Valmar Block 1" } },
                "node_valmar_b2_gf": { "id": "node_valmar_b2_gf", "name": "Hostel Fee & Bill Admissions (Valmar Bldg 2 - GF)", "lat": 13.619450, "lng": 79.290950, "type": "classroom", "tags": ["hostel bill", "hostel fee payment"], "meta": { "floor": 0, "building": "Valmar Block 2 (Middle)" } },
                "node_valmar_b2_f1": { "id": "node_valmar_b2_f1", "name": "R-Innovation Cabin (Valmar Bldg 2 - 1st Floor)", "lat": 13.619450, "lng": 79.290960, "type": "classroom", "tags": ["r innovation cabin", "research lab"], "meta": { "floor": 1, "building": "Valmar Block 2 (Middle)" } },
                "node_valmar_b3_gf": { "id": "node_valmar_b3_gf", "name": "Main Administration Office (Valmar Bldg 3 - GF)", "lat": 13.619480, "lng": 79.291000, "type": "classroom", "tags": ["administration office", "admin office"], "meta": { "floor": 0, "building": "Valmar Block 3" } },
                "node_valmar_b4_gf": { "id": "node_valmar_b4_gf", "name": "IQAC Internal Quality Assurance Cell (Valmar Bldg 4 - GF)", "lat": 13.619510, "lng": 79.291050, "type": "classroom", "tags": ["iqac office", "quality assurance"], "meta": { "floor": 0, "building": "Valmar Block 4" } },

                // PHARMACEUTICAL BLOCK
                "node_sai_temple_gate": { "id": "node_sai_temple_gate", "name": "MBU Sai Baba Temple Gate", "lat": 13.619600, "lng": 79.291500, "type": "gate", "tags": ["sai baba temple gate", "temple gate", "right side gate"], "meta": { "floor": 0, "building": "Exterior Perimeter Gate" } },
                "node_pharmaceutical_entrance": { "id": "node_pharmaceutical_entrance", "name": "Pharmaceutical Sciences Block Main Entrance", "lat": 13.619800, "lng": 79.291600, "type": "entrance", "tags": ["pharmaceutical block", "pharmacy building"], "meta": { "floor": 0, "building": "Pharmaceutical Block" } },
                "node_pharm_1401": { "id": "node_pharm_1401", "name": "Room 1401 - Pharmaceutical Block", "lat": 13.619820, "lng": 79.291550, "type": "classroom", "tags": ["1401", "pharmacy room 1401"], "meta": { "floor": 0, "building": "Pharmaceutical Block", "directorySource": "CAMPUS_ROOMNUMBERS_latest.xlsx" } },
                "node_pharm_1402": { "id": "node_pharm_1402", "name": "Room 1402 - Chemistry Lab 3 / Emergency Exit", "lat": 13.619820, "lng": 79.291650, "type": "classroom", "tags": ["1402", "chemistry lab 3", "emergency exit"], "meta": { "floor": 0, "building": "Pharmaceutical Block", "directorySource": "CAMPUS_ROOMNUMBERS_latest.xlsx" } },
                "node_pharm_1401A": { "id": "node_pharm_1401A", "name": "Room 1401-A - Chemistry Lab", "lat": 13.619840, "lng": 79.291540, "type": "classroom", "tags": ["1401a", "chemistry lab", "chem lab"], "meta": { "floor": 0, "building": "Pharmaceutical Block", "directorySource": "CAMPUS_ROOMNUMBERS_latest.xlsx" } },
                "node_pharm_1402B": { "id": "node_pharm_1402B", "name": "Room 1401-B - Chemistry Lab 2 / Faculty Room", "lat": 13.619840, "lng": 79.291660, "type": "classroom", "tags": ["1401b", "chemistry lab 2", "faculty room"], "meta": { "floor": 0, "building": "Pharmaceutical Block", "directorySource": "CAMPUS_ROOMNUMBERS_latest.xlsx" } },
                "node_pharm_faculty": { "id": "node_pharm_faculty", "name": "Pharmacy Faculty & Professor Cabins", "lat": 13.619860, "lng": 79.291600, "type": "classroom", "tags": ["faculty room", "pharmacy staff cabins"], "meta": { "floor": 0, "building": "Pharmaceutical Block" } },
                "node_pharm_chemical_store": { "id": "node_pharm_chemical_store", "name": "Room 1409 - Chemical Room", "lat": 13.619720, "lng": 79.291550, "type": "classroom", "tags": ["chemical room", "chemical store", "1409"], "meta": { "floor": 0, "building": "Pharmaceutical Block", "directorySource": "CAMPUS_ROOMNUMBERS_latest.xlsx" } },
                "node_pharm_exam_control": { "id": "node_pharm_exam_control", "name": "Room 1407-B - Examination Control Room", "lat": 13.619730, "lng": 79.291540, "type": "classroom", "tags": ["1407b", "examination room", "exam cell", "examination control"], "meta": { "floor": 0, "building": "Pharmaceutical Block", "directorySource": "CAMPUS_ROOMNUMBERS_latest.xlsx" } },
                "node_pharm_1508": { "id": "node_pharm_1508", "name": "Room 1508 - Dean, School of Pharmaceutical Science", "lat": 13.619750, "lng": 79.291540, "type": "classroom", "tags": ["1508", "dean office", "pharmacy dean"], "meta": { "floor": 1, "building": "Pharmaceutical Block", "directorySource": "CAMPUS_ROOMNUMBERS_latest.xlsx" } }
            },
            edges: [
                ["node_main_gate_checkpoint", "node_entry_avenue_split"],
                ["node_entry_avenue_split", "node_front_pond_junction"],
                ["node_front_pond_junction", "node_m_block_front_plaza"],
                ["node_m_block_front_plaza", "node_m_block_foyer"],
                ["node_m_block_foyer", "node_canteen_mblock_junction"],
                ["node_canteen_mblock_junction", "node_canteen_hub"],
                ["node_canteen_hub", "node_valmar_east_road"],
                ["node_valmar_east_road", "node_valmar_b1_gf"],
                ["node_valmar_b1_gf", "node_valmar_b2_gf"],
                ["node_valmar_b2_gf", "node_valmar_b3_gf"],
                ["node_valmar_b3_gf", "node_valmar_b4_gf"],
                ["node_valmar_east_road", "node_sai_temple_gate"],
                ["node_sai_temple_gate", "node_pharmaceutical_entrance"],
                ["node_pharmaceutical_entrance", "node_pharm_1401"],
                ["node_pharmaceutical_entrance", "node_pharm_1402"],
                ["node_pharm_1401", "node_pharm_1401A"],
                ["node_pharm_1402", "node_pharm_1402B"],
                ["node_pharmaceutical_entrance", "node_pharm_faculty"],
                ["node_pharm_faculty", "node_pharm_1508"],
                ["node_pharm_1401", "node_pharm_chemical_store"],
                ["node_pharm_chemical_store", "node_pharm_exam_control"],
                ["node_entry_avenue_split", "node_left_parking_zone"],
                ["node_entry_avenue_split", "node_right_parking_zone"],
                ["node_right_parking_zone", "node_right_bypass_road_junction"],
                ["node_right_bypass_road_junction", "node_valmar_east_road"],
                ["node_main_gate_checkpoint", "node_pedestrian_side_gate"],
                ["node_main_gate_checkpoint", "node_lotus_park_lawn"],
                ["node_west_phase_gate", "node_right_bypass_road_junction"],
                ["node_m_block_foyer", "node_m_block_hq_restricted"],
                ["node_canteen_mblock_junction", "node_unnamed_glass_building"],
                ["node_valmar_b2_gf", "node_valmar_b2_f1"]
            ].map(([from, to]) => ({ from, to, weight: 1, structuralSteps: false, defaultCrowdDensity: 1 }))
        };

    }

    getCampusGraph() {
        return this.campusGraph;
    }

    renderGraphNodes() {
        Object.values(this.campusGraph.nodes).forEach((node) => {
            L.marker([node.lat, node.lng])
                .bindTooltip(node.name)
                .addTo(this.map);
        });
    }

    flyToLocation(lat, lng, zoom = 18) {
        this.map.flyTo([lat, lng], zoom);
    }

    setMapStyle(style) {
        if (style === 'satellite') {
            this.map.removeLayer(this.standardLayer);
            this.satelliteLayer.addTo(this.map);
        } else {
            this.map.removeLayer(this.satelliteLayer);
            this.standardLayer.addTo(this.map);
        }
        this.map.invalidateSize();
    }

    drawPathLine(coordinates, startNode, destinationNode) {
        this.pathLayer.clearLayers();
        this.routeMarkerLayer.clearLayers();
        L.polyline(coordinates, { color: '#2e7d32', weight: 6, opacity: 0.85 })
            .addTo(this.pathLayer);

        if (startNode) {
            L.circleMarker([startNode.lat, startNode.lng], {
                radius: 9,
                color: '#166534',
                weight: 3,
                fillColor: '#22c55e',
                fillOpacity: 1
            }).bindTooltip(`Start: ${startNode.name}`, { permanent: true, direction: 'right' })
                .addTo(this.routeMarkerLayer);
        }

        if (destinationNode) {
            L.circleMarker([destinationNode.lat, destinationNode.lng], {
                radius: 9,
                color: '#991b1b',
                weight: 3,
                fillColor: '#ef4444',
                fillOpacity: 1
            }).bindTooltip(`Destination: ${destinationNode.name}`, { permanent: true, direction: 'left' })
                .addTo(this.routeMarkerLayer);
        }

        this.map.fitBounds(coordinates, { padding: [40, 40] });
    }
}
