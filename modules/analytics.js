export class AnalyticsEngine {
    constructor() {
        // Fallback simulation log array for tracking user navigation clicks
        this.interactionRegistry = JSON.parse(localStorage.getItem('mbu_analytics')) || {
            "node_mns_804_auditorium": 38, // TGR Auditorium (High Traffic Element)
            "node_ews_2f_south_dasari": 24, // Dasari Auditorium
            "node_degree_1712": 15
        };
    }

    trackInteraction(nodeId, actionType) {
        if(!this.interactionRegistry[nodeId]) this.interactionRegistry[nodeId] = 0;
        this.interactionRegistry[nodeId]++;
        localStorage.setItem('mbu_analytics', JSON.stringify(this.interactionRegistry));
    }

    renderHotspots() {
        const container = document.getElementById('analyticsList');
        if(!container) return;
        container.innerHTML = '';
        
        // Present top 3 hot spots dynamically inside sidebar container
        Object.entries(this.interactionRegistry)
            .sort((a,b) => b - a)
            .slice(0, 3)
            .forEach(([nodeId, count]) => {
                const item = document.createElement('div');
                item.className = 'analytics-item';
                item.innerHTML = `<span>Zone Entry [${nodeId.replace('node_','').toUpperCase()}]</span> <strong>${count} requests</strong>`;
                container.appendChild(item);
            });
    }
}