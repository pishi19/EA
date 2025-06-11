"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Copy, 
  Settings, 
  Folder, 
  Users, 
  Check, 
  X, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

// Import client-safe types
import {
  WorkstreamConfig,
  WorkstreamTemplate,
  OPERATION_OPTIONS,
  WORKSTREAM_TEMPLATES,
  DEFAULT_WORKSTREAMS,
  validateWorkstreamName
} from '@/lib/workstream-types';

type WizardStep = 'basic' | 'template' | 'operations' | 'structure' | 'review';

export default function WorkstreamWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkstream, setEditingWorkstream] = useState<string | null>(null);
  
  // Form state
  const [config, setConfig] = useState<Partial<WorkstreamConfig>>({
    name: '',
    displayName: '',
    description: '',
    status: 'planning',
    allowedOperations: ['read', 'write'],
    owner: '',
    phase: '',
    color: '#3b82f6'
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<WorkstreamTemplate | null>(null);
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [existingWorkstreams, setExistingWorkstreams] = useState<WorkstreamConfig[]>([]);

  useEffect(() => {
    loadExistingWorkstreams();
  }, []);

  const loadExistingWorkstreams = async () => {
    try {
      const response = await fetch('/api/workstreams');
      if (response.ok) {
        const workstreams = await response.json();
        setExistingWorkstreams(workstreams);
      } else {
        // Fallback to default workstreams if API fails
        setExistingWorkstreams(DEFAULT_WORKSTREAMS);
      }
    } catch (err) {
      console.error('Failed to load workstreams:', err);
      // Fallback to default workstreams
      setExistingWorkstreams(DEFAULT_WORKSTREAMS);
    }
  };

  const validateName = (name: string): string | null => {
    const existingNames = existingWorkstreams
      .map(ws => ws.name)
      .filter(n => n !== editingWorkstream);
    return validateWorkstreamName(name, existingNames);
  };

  const applyTemplate = (template: WorkstreamTemplate) => {
    setSelectedTemplate(template);
    setConfig(prev => ({
      ...prev,
      ...template.config,
      name: prev.name, // Keep the name from basic step
      displayName: prev.displayName,
      description: prev.description || template.description
    }));
    setCustomFolders(template.structure.customFolders);
  };

  const handleNext = () => {
    const steps: WizardStep[] = ['basic', 'template', 'operations', 'structure', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: WizardStep[] = ['basic', 'template', 'operations', 'structure', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...config,
        dataPath: `/runtime/workstreams/${config.name}`,
        customFolders,
        template: selectedTemplate?.name
      };

      const url = isEditing ? `/api/workstreams/${editingWorkstream}` : '/api/workstreams';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(isEditing ? 'Workstream updated successfully!' : 'Workstream created successfully!');
        
        // Reset form after success
        setTimeout(() => {
          resetForm();
          loadExistingWorkstreams();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save workstream');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workstream');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfig({
      name: '',
      displayName: '',
      description: '',
      status: 'planning',
      allowedOperations: ['read', 'write'],
      owner: '',
      phase: '',
      color: '#3b82f6'
    });
    setSelectedTemplate(null);
    setCustomFolders([]);
    setCurrentStep('basic');
    setIsEditing(false);
    setEditingWorkstream(null);
    setError('');
    setSuccess('');
  };

  const startEditing = (workstream: WorkstreamConfig) => {
    setConfig(workstream);
    setIsEditing(true);
    setEditingWorkstream(workstream.name);
    setCurrentStep('basic');
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'basic', label: 'Basic Info', icon: <Settings className="w-4 h-4" /> },
      { key: 'template', label: 'Template', icon: <Copy className="w-4 h-4" /> },
      { key: 'operations', label: 'Permissions', icon: <Users className="w-4 h-4" /> },
      { key: 'structure', label: 'Structure', icon: <Folder className="w-4 h-4" /> },
      { key: 'review', label: 'Review', icon: <Check className="w-4 h-4" /> }
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep === step.key 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : steps.findIndex(s => s.key === currentStep) > index
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 text-gray-500'
            }`}>
              {step.icon}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep === step.key ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 mx-4 text-gray-400" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderBasicStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Workstream Name</Label>
        <Input
          id="name"
          value={config.name}
          onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value.toLowerCase() }))}
          placeholder="e.g., customer-experience"
          disabled={isEditing}
        />
        {config.name && validateName(config.name) && (
          <p className="text-sm text-red-600 mt-1">{validateName(config.name)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={config.displayName}
          onChange={(e) => setConfig(prev => ({ ...prev, displayName: e.target.value }))}
          placeholder="e.g., Customer Experience Initiative"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={config.description}
          onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of this workstream's purpose and goals"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="owner">Owner</Label>
          <Input
            id="owner"
            value={config.owner}
            onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
            placeholder="e.g., Product Team"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={config.status}
            onValueChange={(value) => setConfig(prev => ({ ...prev, status: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="phase">Current Phase</Label>
        <Input
          id="phase"
          value={config.phase}
          onChange={(e) => setConfig(prev => ({ ...prev, phase: e.target.value }))}
          placeholder="e.g., 1 - Discovery & Planning"
        />
      </div>
    </div>
  );

  const renderTemplateStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Choose a Template</h3>
        <p className="text-gray-600 mb-6">
          Select a template to pre-configure your workstream with common settings and structure.
        </p>
      </div>

      <div className="grid gap-4">
        {WORKSTREAM_TEMPLATES.map((template) => (
          <Card 
            key={template.name}
            className={`cursor-pointer transition-all ${
              selectedTemplate?.name === template.name 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => applyTemplate(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{template.displayName}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {template.config.allowedOperations?.map((op) => (
                      <Badge key={op} variant="secondary" className="text-xs">
                        {op}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {selectedTemplate?.name === template.name && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedTemplate(null);
            setConfig(prev => ({
              ...prev,
              allowedOperations: ['read', 'write'],
              status: 'planning'
            }));
          }}
        >
          Skip Template (Custom Setup)
        </Button>
      </div>
    </div>
  );

  const renderOperationsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Configure Permissions</h3>
        <p className="text-gray-600 mb-6">
          Select which operations are allowed in this workstream.
        </p>
      </div>

      <div className="grid gap-3">
        {OPERATION_OPTIONS.map((option) => (
          <Card key={option.value} className="p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.allowedOperations?.includes(option.value) || false}
                onChange={(e) => {
                  const operations = config.allowedOperations || [];
                  if (e.target.checked) {
                    setConfig(prev => ({
                      ...prev,
                      allowedOperations: [...operations, option.value]
                    }));
                  } else {
                    setConfig(prev => ({
                      ...prev,
                      allowedOperations: operations.filter(op => op !== option.value)
                    }));
                  }
                }}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStructureStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Directory Structure</h3>
        <p className="text-gray-600 mb-6">
          Configure the folder structure for your workstream.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Standard Folders (Always Created)</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
              <span>/runtime/workstreams/{config.name}/artefacts/</span>
            </div>
            <div className="flex items-center text-sm">
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
              <span>/runtime/workstreams/{config.name}/logs/</span>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="customFolders">Custom Folders</Label>
          <div className="space-y-2">
            {customFolders.map((folder, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={folder}
                  onChange={(e) => {
                    const newFolders = [...customFolders];
                    newFolders[index] = e.target.value;
                    setCustomFolders(newFolders);
                  }}
                  placeholder="Folder name"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomFolders(customFolders.filter((_, i) => i !== index))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setCustomFolders([...customFolders, ''])}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Folder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Review Configuration</h3>
        <p className="text-gray-600 mb-6">
          Please review your workstream configuration before creating it.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Basic Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Name:</strong> {config.name}</div>
            <div><strong>Display Name:</strong> {config.displayName}</div>
            <div><strong>Status:</strong> <Badge variant="outline">{config.status}</Badge></div>
            <div><strong>Owner:</strong> {config.owner || 'Not set'}</div>
            <div className="col-span-2"><strong>Description:</strong> {config.description}</div>
            <div className="col-span-2"><strong>Phase:</strong> {config.phase || 'Not set'}</div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Permissions</h4>
          <div className="flex flex-wrap gap-2">
            {config.allowedOperations?.map((op) => (
              <Badge key={op} variant="secondary">{op}</Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Directory Structure</h4>
          <div className="space-y-1 text-sm font-mono">
            <div>/runtime/workstreams/{config.name}/</div>
            <div className="ml-4">├── artefacts/</div>
            <div className="ml-4">├── logs/</div>
            <div className="ml-4">├── roadmap.md</div>
            {customFolders.map((folder, index) => (
              <div key={index} className="ml-4">├── {folder}/</div>
            ))}
          </div>
        </Card>

        {selectedTemplate && (
          <Card className="p-4">
            <h4 className="font-medium mb-3">Template Applied</h4>
            <div className="text-sm">
              <strong>{selectedTemplate.displayName}</strong> - {selectedTemplate.description}
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic': return renderBasicStep();
      case 'template': return renderTemplateStep();
      case 'operations': return renderOperationsStep();
      case 'structure': return renderStructureStep();
      case 'review': return renderReviewStep();
      default: return renderBasicStep();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'basic':
        return config.name && config.displayName && !validateName(config.name);
      case 'template':
        return true; // Template is optional
      case 'operations':
        return config.allowedOperations && config.allowedOperations.length > 0;
      case 'structure':
        return true; // Structure is optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Existing Workstreams */}
      {!isEditing && existingWorkstreams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Workstreams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {existingWorkstreams.map((workstream) => (
                <div key={workstream.name} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{workstream.displayName}</div>
                    <div className="text-sm text-gray-600">{workstream.description}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{workstream.status}</Badge>
                      {workstream.owner && <Badge variant="secondary">{workstream.owner}</Badge>}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(workstream)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wizard */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? `Edit Workstream: ${editingWorkstream}` : 'Create New Workstream'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <div>
              {currentStep !== 'basic' && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              
              {currentStep === 'review' ? (
                <Button onClick={handleSubmit} disabled={loading || !isStepValid()}>
                  {loading ? 'Creating...' : isEditing ? 'Update Workstream' : 'Create Workstream'}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!isStepValid()}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 