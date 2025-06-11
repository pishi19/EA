"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Edit, X, AlertCircle, CheckCircle } from 'lucide-react';

interface PhaseContext {
    phase: string;
    strategicFocus: string;
    keyObjectives: string[];
    currentChallenges: string[];
    successCriteria: string[];
    dependencies: string[];
    nextPhasePreparation: string;
}

interface PhaseInfo {
    id: string;
    number: string;
    title: string;
    fullTitle: string;
    status?: string;
}

interface PhaseContextEditorProps {
    onUpdate?: (phase: string, context: PhaseContext) => void;
}

const PhaseContextEditor: React.FC<PhaseContextEditorProps> = ({ onUpdate }) => {
    const [selectedPhase, setSelectedPhase] = useState<string>('');
    const [context, setContext] = useState<PhaseContext | null>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [availablePhases, setAvailablePhases] = useState<PhaseInfo[]>([]);

    // Fetch available phases on component mount
    useEffect(() => {
        const fetchPhases = async () => {
            try {
                const response = await fetch('/api/phases');
                if (response.ok) {
                    const phasesData = await response.json();
                    setAvailablePhases(Array.isArray(phasesData) ? phasesData : []);
                }
            } catch (error) {
                console.error('Error fetching phases:', error);
                setAvailablePhases([]);
            }
        };
        fetchPhases();
    }, []);

    const fetchPhaseContext = async (phase: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/phase-context?phase=${phase}`);
            if (response.ok) {
                const data = await response.json();
                setContext(data);
            } else {
                const phaseInfo = availablePhases.find(p => p.number === phase);
                const phaseTitle = phaseInfo ? phaseInfo.fullTitle : `Phase ${phase}`;
                
                // Initialize empty context for new phases
                setContext({
                    phase: phaseTitle,
                    strategicFocus: '',
                    keyObjectives: [],
                    currentChallenges: [],
                    successCriteria: [],
                    dependencies: [],
                    nextPhasePreparation: ''
                });
            }
        } catch (error) {
            console.error('Error fetching phase context:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhaseSelect = (phase: string) => {
        setSelectedPhase(phase);
        setEditing(false);
        fetchPhaseContext(phase);
    };

    const handleSave = async () => {
        if (!context || !selectedPhase) return;
        
        try {
            setSaveStatus('saving');
            
            // In a real implementation, this would save to roadmap.md
            // For now, we'll simulate a save operation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setSaveStatus('saved');
            setEditing(false);
            
            if (onUpdate) {
                onUpdate(selectedPhase, context);
            }
            
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Error saving phase context:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const updateField = (field: keyof PhaseContext, value: string | string[]) => {
        if (!context) return;
        setContext({ ...context, [field]: value });
    };

    const updateListField = (field: 'keyObjectives' | 'currentChallenges' | 'successCriteria' | 'dependencies', value: string) => {
        if (!context) return;
        const items = value.split('\n').filter(line => line.trim()).map(line => line.replace(/^-\s*/, '').trim());
        updateField(field, items);
    };

    const getSaveButtonIcon = () => {
        switch (saveStatus) {
            case 'saving': return <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />;
            case 'saved': return <CheckCircle className="w-4 h-4" />;
            case 'error': return <AlertCircle className="w-4 h-4" />;
            default: return <Save className="w-4 h-4" />;
        }
    };

    const getSaveButtonText = () => {
        switch (saveStatus) {
            case 'saving': return 'Saving...';
            case 'saved': return 'Saved!';
            case 'error': return 'Error';
            default: return 'Save Changes';
        }
    };

    const renderListEditor = (
        title: string,
        field: 'keyObjectives' | 'currentChallenges' | 'successCriteria' | 'dependencies',
        placeholder: string
    ) => {
        if (!context) return null;
        
        const items = context[field] as string[];
        
        return (
            <div className="space-y-2">
                <label className="text-sm font-medium">{title}</label>
                
                {editing ? (
                    <Textarea
                        value={items.map(item => `- ${item}`).join('\n')}
                        onChange={(e) => updateListField(field, e.target.value)}
                        placeholder={`${placeholder}\n- Item 2\n- Item 3`}
                        className="min-h-[100px]"
                    />
                ) : (
                    <div className="space-y-1 p-2 bg-muted rounded">
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <div key={index} className="text-sm">
                                    • {item}
                                </div>
                            ))
                        ) : (
                            <span className="text-sm text-muted-foreground">No {title.toLowerCase()} defined</span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Phase Context Editor
                        <div className="flex items-center gap-2">
                            <Select value={selectedPhase} onValueChange={handlePhaseSelect}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Select Phase" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePhases && availablePhases.length > 0 ? (
                                        availablePhases.map(phase => (
                                            <SelectItem key={phase.number} value={phase.number}>
                                                {phase.fullTitle}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="loading" disabled>
                                            Loading phases...
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            
                            {context && !editing && (
                                <Button onClick={() => setEditing(true)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                            
                            {editing && (
                                <>
                                    <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
                                        {getSaveButtonIcon()}
                                        <span className="ml-2">{getSaveButtonText()}</span>
                                    </Button>
                                    <Button variant="outline" onClick={() => setEditing(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                            <span className="ml-2">Loading phase context...</span>
                        </div>
                    ) : context ? (
                        <div className="space-y-6">
                            {/* Strategic Focus */}
                            <div>
                                <label className="text-sm font-medium">Strategic Focus</label>
                                {editing ? (
                                    <Textarea
                                        value={context.strategicFocus}
                                        onChange={(e) => updateField('strategicFocus', e.target.value)}
                                        placeholder="Describe the strategic focus for this phase..."
                                        className="mt-1"
                                    />
                                ) : (
                                    <p className="text-sm mt-1 p-2 bg-muted rounded">
                                        {context.strategicFocus || 'No strategic focus defined'}
                                    </p>
                                )}
                            </div>

                            {/* Key Objectives */}
                            {renderListEditor('Key Objectives', 'keyObjectives', '- Objective 1')}

                            {/* Current Challenges */}
                            {renderListEditor('Current Challenges', 'currentChallenges', '- Challenge 1')}

                            {/* Success Criteria */}
                            {renderListEditor('Success Criteria', 'successCriteria', '- Success criterion 1')}

                            {/* Dependencies */}
                            {renderListEditor('Dependencies', 'dependencies', '- Dependency 1')}

                            {/* Next Phase Preparation */}
                            <div>
                                <label className="text-sm font-medium">Next Phase Preparation</label>
                                {editing ? (
                                    <Textarea
                                        value={context.nextPhasePreparation}
                                        onChange={(e) => updateField('nextPhasePreparation', e.target.value)}
                                        placeholder="Describe how this phase prepares for the next..."
                                        className="mt-1"
                                    />
                                ) : (
                                    <p className="text-sm mt-1 p-2 bg-muted rounded">
                                        {context.nextPhasePreparation || 'No next phase preparation defined'}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Select a phase to view and edit its context</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PhaseContextEditor; 