export class SemanticSearch {
    constructor(graph) {
        this.graph = graph;
    }

    normalize(value) {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }

    roomCodes(node) {
        const source = `${node.name} ${node.tags.join(' ')}`;
        return source.match(/\b\d{3,4}(?:[- ]?[A-Z])?\b/gi) || [];
    }

    findBestMatch(rawQuery) {
        const queryCleaned = this.normalize(rawQuery);
        if (!queryCleaned) return null;

        const exactRoomMatch = Object.values(this.graph.nodes).find((node) => (
            this.roomCodes(node).some((roomCode) => this.normalize(roomCode) === queryCleaned)
        ));
        if (exactRoomMatch) return exactRoomMatch;
        if (/^\d{3,4}(?:[ -]?[A-Z])?$/i.test(rawQuery.trim())) return null;

        const queryTokens = queryCleaned.split(/\s+/);
        let maxScore = -1;
        let selectedNode = null;

        Object.values(this.graph.nodes).forEach(node => {
            const searchableText = this.normalize(`${node.name} ${node.tags.join(' ')} ${node.meta.building || ''}`);
            const searchableTokens = searchableText.split(/\s+/);
            let score = 0;

            if (this.normalize(node.name) === queryCleaned) score += 100;
            if (searchableText.includes(queryCleaned)) score += 20;
            queryTokens.forEach(token => {
                if (searchableTokens.includes(token)) score += 8;
                else if (searchableText.includes(token)) score += 3;
            });

            if (score > maxScore && score > 0) {
                maxScore = score;
                selectedNode = node;
            }
        });

        return selectedNode;
    }
}
