import { describe, it, expect } from 'vitest';
import { createEditorInterfaceTools } from './register.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('Editor Interface Tools Registration', () => {
  const mockConfig = createMockConfig();

  it('should export createEditorInterfaceTools factory function', () => {
    expect(createEditorInterfaceTools).toBeDefined();
    expect(typeof createEditorInterfaceTools).toBe('function');
  });

  it('should export all editor interface tools', () => {
    const editorInterfaceTools = createEditorInterfaceTools(mockConfig);
    expect(editorInterfaceTools.listEditorInterfaces).toBeDefined();
    expect(editorInterfaceTools.getEditorInterface).toBeDefined();
    expect(editorInterfaceTools.updateEditorInterface).toBeDefined();
  });

  it('should have correct tool configuration for listEditorInterfaces', () => {
    const editorInterfaceTools = createEditorInterfaceTools(mockConfig);
    const tool = editorInterfaceTools.listEditorInterfaces;
    expect(tool.title).toBe('list_editor_interfaces');
    expect(tool.description).toBeTruthy();
    expect(tool.inputParams).toBeDefined();
    expect(tool.annotations).toBeDefined();
    expect(tool.annotations.readOnlyHint).toBe(true);
    expect(tool.tool).toBeDefined();
    expect(typeof tool.tool).toBe('function');
  });

  it('should have correct tool configuration for getEditorInterface', () => {
    const editorInterfaceTools = createEditorInterfaceTools(mockConfig);
    const tool = editorInterfaceTools.getEditorInterface;
    expect(tool.title).toBe('get_editor_interface');
    expect(tool.description).toBeTruthy();
    expect(tool.inputParams).toBeDefined();
    expect(tool.annotations).toBeDefined();
    expect(tool.annotations.readOnlyHint).toBe(true);
    expect(tool.tool).toBeDefined();
    expect(typeof tool.tool).toBe('function');
  });

  it('should have correct tool configuration for updateEditorInterface', () => {
    const editorInterfaceTools = createEditorInterfaceTools(mockConfig);
    const tool = editorInterfaceTools.updateEditorInterface;
    expect(tool.title).toBe('update_editor_interface');
    expect(tool.description).toBeTruthy();
    expect(tool.inputParams).toBeDefined();
    expect(tool.annotations).toBeDefined();
    expect(tool.annotations.readOnlyHint).toBe(false);
    expect(tool.annotations.destructiveHint).toBe(false);
    expect(tool.tool).toBeDefined();
    expect(typeof tool.tool).toBe('function');
  });
});
