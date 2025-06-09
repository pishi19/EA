import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Target, Users, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoadmapHierarchy } from './roadmapParser';

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
    expanded?: boolean;
    status?: string;
    roadmapDefined?: boolean; // Indicates if this node comes from roadmap.md
}

interface TreeNavigationProps {
    artefacts: Artefact[];
    roadmapHierarchy: RoadmapHierarchy | null;
    onNodeSelect: (node: TreeNode, artefact?: Artefact) => void;
    selectedNodeId?: string;
    className?: string;
    validateArtefactAlignment?: (artefact: Artefact) => any;
}

export default function TreeNavigation({ 
    artefacts, 
    roadmapHierarchy,
    onNodeSelect, 
    selectedNodeId,
    className = "",
    validateArtefactAlignment
}: TreeNavigationProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['Ora'])); // Default expand Ora workstream

    // Build hierarchical tree structure from roadmap.md as source of truth
    const treeData = useMemo(() => {
        if (!roadmapHierarchy) {
            return []; // No tree until roadmap loads
        }

        const tree: TreeNode[] = [];
        
        // Create workstream nodes from roadmap
        roadmapHierarchy.workstreams.forEach(workstream => {
            const workstreamNode: TreeNode = {
                id: `ws-${workstream}`,
                label: workstream,
                type: 'workstream',
                level: 0,
                children: [],
                count: 0,
                roadmapDefined: true
            };
            
            // Add programs from roadmap
            const workstreamPrograms = roadmapHierarchy.programs.filter(program => 
                workstream === 'Ora' // All programs belong to Ora for now
            );
            
            workstreamPrograms.forEach(program => {
                const programNode: TreeNode = {
                    id: `prog-${program.id}`,
                    label: program.displayLabel || program.fullName || program.name,
                    type: 'program',
                    level: 1,
                    children: [],
                    count: 0,
                    status: program.status,
                    roadmapDefined: true
                };
                
                // Add projects from roadmap
                const programProjects = roadmapHierarchy.projects.filter(project => 
                    project.programId === program.id
                );
                
                programProjects.forEach(project => {
                    const projectNode: TreeNode = {
                        id: `proj-${project.id}`,
                        label: project.displayLabel || project.fullName || project.name,
                        type: 'project',
                        level: 2,
                        children: [],
                        count: 0,
                        status: project.status,
                        roadmapDefined: true
                    };
                    
                    // Add artefacts that align with this project
                    artefacts.forEach(artefact => {
                        if (validateArtefactAlignment) {
                            const alignment = validateArtefactAlignment(artefact);
                            const isAlignedToProject = alignment.validProjects.some((proj: any) => proj.id === project.id);
                            
                            if (isAlignedToProject) {
                                const artefactNode: TreeNode = {
                                    id: `art-${artefact.id}`,
                                    label: artefact.title,
                                    type: 'artefact',
                                    level: 3,
                                    children: [],
                                    artefact: artefact,
                                    roadmapDefined: false // Artefacts are data, not roadmap structure
                                };
                                projectNode.children.push(artefactNode);
                                projectNode.count = (projectNode.count || 0) + 1;
                            }
                        }
                    });
                    
                    programNode.children.push(projectNode);
                });
                
                // Add artefacts that align with program but no specific project
                artefacts.forEach(artefact => {
                    if (validateArtefactAlignment) {
                        const alignment = validateArtefactAlignment(artefact);
                        const isAlignedToProgram = alignment.validProgram?.id === program.id;
                        const hasProjectAlignment = alignment.validProjects.length > 0;
                        
                        if (isAlignedToProgram && !hasProjectAlignment) {
                            const artefactNode: TreeNode = {
                                id: `art-${artefact.id}`,
                                label: artefact.title,
                                type: 'artefact',
                                level: 2,
                                children: [],
                                artefact: artefact,
                                roadmapDefined: false
                            };
                            programNode.children.push(artefactNode);
                        }
                    }
                });
                
                // Calculate program count
                programNode.count = programNode.children.reduce((sum, child) => {
                    return sum + (child.type === 'artefact' ? 1 : (child.count || 0));
                }, 0);
                
                workstreamNode.children.push(programNode);
            });
            
            // Calculate workstream count
            workstreamNode.count = workstreamNode.children.reduce((sum, child) => {
                return sum + (child.count || 0);
            }, 0);
            
            tree.push(workstreamNode);
        });

        // Sort children at each level
        const sortChildren = (node: TreeNode) => {
            node.children.sort((a, b) => {
                // Roadmap-defined nodes come first, then artefacts
                if (a.roadmapDefined && !b.roadmapDefined) return -1;
                if (!a.roadmapDefined && b.roadmapDefined) return 1;
                return a.label.localeCompare(b.label);
            });
            node.children.forEach(sortChildren);
        };

        tree.forEach(sortChildren);
        return tree;
    }, [artefacts, roadmapHierarchy, validateArtefactAlignment]);

    const toggleExpanded = (nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

    const handleNodeClick = (node: TreeNode) => {
        if (node.type === 'artefact' && node.artefact) {
            onNodeSelect(node, node.artefact);
        } else {
            // For non-artefact nodes, toggle expansion and select
            toggleExpanded(node.id);
            onNodeSelect(node);
        }
    };

    const getNodeIcon = (node: TreeNode, isExpanded: boolean) => {
        switch (node.type) {
            case 'workstream':
                return <Users className="h-4 w-4 text-blue-600" />;
            case 'program':
                return <Target className="h-4 w-4 text-purple-600" />;
            case 'project':
                return <Hash className="h-4 w-4 text-green-600" />;
            case 'artefact':
                return <FileText className="h-4 w-4 text-gray-600" />;
            default:
                return isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'complete': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'planning': return 'bg-yellow-100 text-yellow-800';
            case 'next': return 'bg-purple-100 text-purple-800';
            case 'planned': return 'bg-gray-100 text-gray-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const renderTreeNode = (node: TreeNode): React.ReactNode => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedNodeId === node.id;
        const hasChildren = node.children.length > 0;
        const indent = node.level * 16;

        return (
            <div key={node.id} className="select-none">
                <div
                    className={`
                        flex items-center py-1.5 px-2 mx-1 rounded cursor-pointer
                        hover:bg-gray-100 transition-colors duration-150
                        ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}
                        ${node.roadmapDefined ? 'border-l-2 border-l-green-300' : ''}
                    `}
                    style={{ paddingLeft: `${indent + 8}px` }}
                    onClick={() => handleNodeClick(node)}
                    title={node.roadmapDefined ? 'Defined in roadmap.md' : 'Data artefact'}
                >
                    {/* Expand/Collapse Icon */}
                    <div className="w-5 h-5 flex items-center justify-center mr-1">
                        {hasChildren ? (
                            isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-gray-500" />
                            ) : (
                                <ChevronRight className="h-3 w-3 text-gray-500" />
                            )
                        ) : null}
                    </div>

                    {/* Node Icon */}
                    <div className="mr-2">
                        {getNodeIcon(node, isExpanded)}
                    </div>

                    {/* Node Label */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                            <span className={`
                                text-sm truncate
                                ${node.type === 'artefact' ? 'text-gray-700' : 'font-medium text-gray-900'}
                                ${isSelected ? 'text-blue-700' : ''}
                            `}>
                                {node.label}
                            </span>
                            
                            {/* Count Badge */}
                            {node.count !== undefined && node.count > 0 && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    {node.count}
                                </Badge>
                            )}
                            
                            {/* Status Badge for Programs/Projects */}
                            {node.status && node.type !== 'artefact' && (
                                <Badge className={`text-xs px-1.5 py-0 ${getStatusColor(node.status)}`}>
                                    {node.status}
                                </Badge>
                            )}
                            
                            {/* Status Badge for Artefacts */}
                            {node.artefact?.status && (
                                <Badge className={`text-xs px-1.5 py-0 ${getStatusColor(node.artefact.status)}`}>
                                    {node.artefact.status}
                                </Badge>
                            )}
                            
                            {/* Roadmap indicator */}
                            {node.roadmapDefined && (
                                <Badge variant="outline" className="text-xs px-1 py-0 bg-green-50 text-green-700">
                                    📋
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div>
                        {node.children.map(child => renderTreeNode(child))}
                    </div>
                )}
            </div>
        );
    };

    if (!roadmapHierarchy) {
        return (
            <Card className={`h-full ${className}`}>
                <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-lg mb-2">Loading roadmap structure...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`h-full ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                    <Folder className="h-5 w-5" />
                    <span>Roadmap Tree</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        roadmap.md
                    </Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                    Roadmap-driven navigation: {artefacts.length} artefacts, {roadmapHierarchy.programs.length} programs, {roadmapHierarchy.projects.length} projects
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const allNodeIds = new Set<string>();
                            const collectIds = (nodes: TreeNode[]) => {
                                nodes.forEach(node => {
                                    allNodeIds.add(node.id);
                                    collectIds(node.children);
                                });
                            };
                            collectIds(treeData);
                            setExpandedNodes(allNodeIds);
                        }}
                    >
                        Expand All
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedNodes(new Set())}
                    >
                        Collapse All
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                    {treeData.map(node => renderTreeNode(node))}
                </div>
            </CardContent>
        </Card>
    );
} 