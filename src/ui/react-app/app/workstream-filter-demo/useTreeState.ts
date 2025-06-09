import { useState, useCallback, useMemo } from 'react';

interface Artefact {
    id: string;
    name: string;
    title: string;
    phase: string;
    workstream: string;
    program?: string;
    status: string;
    score: number;
    tags: string[];
    created: string;
    uuid: string;
    summary: string;
    filePath: string;
    origin: string;
    type?: string;
}

interface TreeNode {
    id: string;
    label: string;
    type: 'workstream' | 'program' | 'project' | 'artefact';
    level: number;
    children: TreeNode[];
    artefact?: Artefact;
    count?: number;
}

interface TreeState {
    selectedNode: TreeNode | null;
    selectedArtefact: Artefact | null;
    expandedNodes: Set<string>;
    treeVisible: boolean;
}

interface TreeActions {
    selectNode: (node: TreeNode, artefact?: Artefact) => void;
    toggleExpanded: (nodeId: string) => void;
    expandAll: (nodes: TreeNode[]) => void;
    collapseAll: () => void;
    toggleTreeVisibility: () => void;
    clearSelection: () => void;
    syncWithFilters: (workstream: string, program: string, project: string) => void;
}

export interface UseTreeStateReturn extends TreeState, TreeActions {}

export default function useTreeState(): UseTreeStateReturn {
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    const [selectedArtefact, setSelectedArtefact] = useState<Artefact | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['Ora'])); // Default expand Ora
    const [treeVisible, setTreeVisible] = useState<boolean>(true);

    const selectNode = useCallback((node: TreeNode, artefact?: Artefact) => {
        setSelectedNode(node);
        setSelectedArtefact(artefact || null);
    }, []);

    const toggleExpanded = useCallback((nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    const expandAll = useCallback((nodes: TreeNode[]) => {
        const getAllNodeIds = (nodeList: TreeNode[]): string[] => {
            const ids: string[] = [];
            nodeList.forEach(node => {
                ids.push(node.id);
                if (node.children.length > 0) {
                    ids.push(...getAllNodeIds(node.children));
                }
            });
            return ids;
        };
        
        setExpandedNodes(new Set(getAllNodeIds(nodes)));
    }, []);

    const collapseAll = useCallback(() => {
        setExpandedNodes(new Set());
    }, []);

    const toggleTreeVisibility = useCallback(() => {
        setTreeVisible(prev => !prev);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedNode(null);
        setSelectedArtefact(null);
    }, []);

    // Sync tree state with filter selections
    const syncWithFilters = useCallback((workstream: string, program: string, project: string) => {
        const nodesToExpand = new Set<string>();
        
        // Always expand selected workstream
        if (workstream !== 'all') {
            nodesToExpand.add(`ws-${workstream}`);
            
            // Expand selected program if specified
            if (program !== 'all') {
                nodesToExpand.add(`prog-${workstream}-${program}`);
                
                // Expand selected project if specified
                if (project !== 'all') {
                    nodesToExpand.add(`proj-${workstream}-${program}-${project}`);
                }
            }
        }

        // Merge with existing expanded nodes
        setExpandedNodes(prev => new Set([...prev, ...nodesToExpand]));
    }, []);

    return {
        selectedNode,
        selectedArtefact,
        expandedNodes,
        treeVisible,
        selectNode,
        toggleExpanded,
        expandAll,
        collapseAll,
        toggleTreeVisibility,
        clearSelection,
        syncWithFilters
    };
} 