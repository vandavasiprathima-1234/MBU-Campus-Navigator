export class RouterEngine {
    constructor(graph) {
        this.graph = graph;
    }

    getDistanceMeters(firstNode, secondNode) {
        const earthRadius = 6371000;
        const toRadians = (degrees) => degrees * Math.PI / 180;
        const latitudeDelta = toRadians(secondNode.lat - firstNode.lat);
        const longitudeDelta = toRadians(secondNode.lng - firstNode.lng);
        const firstLatitude = toRadians(firstNode.lat);
        const secondLatitude = toRadians(secondNode.lat);
        const haversine = Math.sin(latitudeDelta / 2) ** 2
            + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

        return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    }

    getDirection(fromNode, toNode, stepNumber, totalSteps) {
        const latitudeDelta = toNode.lat - fromNode.lat;
        const longitudeDelta = toNode.lng - fromNode.lng;
        const angle = (Math.atan2(longitudeDelta, latitudeDelta) * 180 / Math.PI + 360) % 360;
        const compassPoints = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
        const compassDirection = compassPoints[Math.round(angle / 45) % compassPoints.length];
        const distance = Math.round(this.getDistanceMeters(fromNode, toNode));
        const prefix = stepNumber === 1 ? 'Start' : stepNumber === totalSteps ? 'Arrive' : 'Continue';

        if (prefix === 'Start') {
            return `Start at ${fromNode.name}, then walk ${distance} m ${compassDirection} to ${toNode.name}.`;
        }
        if (prefix === 'Arrive') {
            return `Arrive at ${toNode.name} after walking ${distance} m ${compassDirection}.`;
        }
        return `Continue ${compassDirection} for ${distance} m toward ${toNode.name}.`;
    }

    computePath(startId, targetId, filters) {
        // Implement Adjacency List Compilation
        const adjacency = {};
        Object.keys(this.graph.nodes).forEach(id => adjacency[id] = []);
        
        this.graph.edges.forEach(edge => {
            const fromNode = this.graph.nodes[edge.from];
            const toNode = this.graph.nodes[edge.to];
            let computationalWeight = this.getDistanceMeters(fromNode, toNode);

            // Apply Path Constraints
            if (filters.wheelchair && edge.structuralSteps) {
                computationalWeight += 5000; // Impose severe penalty matrix
            }
            if (filters.crowded) {
                computationalWeight += (edge.defaultCrowdDensity * 300); // Scale density penalty
            }

            adjacency[edge.from].push({ to: edge.to, cost: computationalWeight, distance: this.getDistanceMeters(fromNode, toNode), original: edge });
            adjacency[edge.to].push({ to: edge.from, cost: computationalWeight, distance: this.getDistanceMeters(fromNode, toNode), original: edge }); // Bidirectional layout
        });

        // Execute Dijkstra's Path Optimization
        const distances = {};
        const backtrace = {};
        const unvisited = new Set();

        Object.keys(this.graph.nodes).forEach(id => {
            distances[id] = Infinity;
            unvisited.add(id);
        });
        distances[startId] = 0;

        while (unvisited.size > 0) {
            let currentNodeId = null;
            unvisited.forEach(id => {
                if (currentNodeId === null || distances[id] < distances[currentNodeId]) {
                    currentNodeId = id;
                }
            });

            if (distances[currentNodeId] === Infinity || currentNodeId === targetId) break;
            unvisited.delete(currentNodeId);

            adjacency[currentNodeId].forEach(neighbor => {
                if (!unvisited.has(neighbor.to)) return;
                const altPathCost = distances[currentNodeId] + neighbor.cost;
                if (altPathCost < distances[neighbor.to]) {
                    distances[neighbor.to] = altPathCost;
                    backtrace[neighbor.to] = currentNodeId;
                }
            });
        }

        // Reconstruct Optimal Coordinates Matrix
        if (distances[targetId] === Infinity) return { success: false };

        const pathNodes = [];
        let totalDistance = 0;
        let tracer = targetId;
        while (tracer !== undefined) {
            pathNodes.unshift(this.graph.nodes[tracer]);
            if (backtrace[tracer] !== undefined) {
                totalDistance += this.getDistanceMeters(this.graph.nodes[backtrace[tracer]], this.graph.nodes[tracer]);
            }
            tracer = backtrace[tracer];
        }

        const coordinates = pathNodes.map(n => [n.lat, n.lng]);
        const directions = pathNodes.slice(1).map((node, index) => (
            this.getDirection(pathNodes[index], node, index + 1, pathNodes.length - 1)
        ));
        
        // Formulate Explainable AI (XAI) Context Logs
        let explanation = `Route compiled via mathematical structural evaluation. `;
        if (filters.wheelchair) explanation += `⚠️ Steep staircases bypassed to prioritize flat paths or elevator shafts dynamically. `;
        if (filters.crowded) explanation += `🏃 Selected pedestrian pathways with low active user density metrics to avoid traffic jams. `;
        if (!filters.wheelchair && !filters.crowded) explanation += `⚡ Path optimized for standard velocity parameters.`;

        return {
            success: true,
            coordinates: coordinates,
            totalDistance: Math.round(totalDistance),
            directions: directions,
            explanation: explanation
        };
    }
}
