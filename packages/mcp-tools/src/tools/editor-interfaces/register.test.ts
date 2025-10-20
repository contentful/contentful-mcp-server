import { describe, it, expect } from 'vitest';
import { editorInterfaceTools } from './register.js';

describe('Editor Interface Tools Registration', () => {
  it('should export all editor interface tools', () => {
    expect(editorInterfaceTools.listEditorInterfaces).toBeDefined();
    expect(editorInterfaceTools.getEditorInterface).toBeDefined();
    expect(editorInterfaceTools.updateEditorInterface).toBeDefined();
  });

  it('should have correct tool configuration for listEditorInterfaces', () => {
    const tool = editorInterfaceTools.listEditorInterfaces;
    expect(tool.title).toBe('list_editor_interfaces');
    expect(tool.description).toBeTruthy();
    expect(tool.inputParams).toBeDefined();
    expect(tool.annotations).toBeDefined();
    expect(tool.annotations.readOnlyHint).toBe(true);
    expect(tool.tool).toBeDefined();
  });

  it('should have correct tool configuration for getEditorInterface', () => {
    const tool = editorInterfaceTools.getEditorInterface;
    expect(tool.title).toBe('get_editor_interface');
    expect(tool.description).toBeTruthy();
    expect(tool.inputParams).toBeDefined();
    expect(tool.annotations).toBeDefined();
    expect(tool.annotations.readOnlyHint).toBe(true);
    expect(tool.tool).toBeDefined();
  });

  it('should have correct tool configuration for updateEditorInterface', () => {
    const tool = editorInterfaceTools.updateEditorInterface;
    expect(tool.title).toBe('update_editor_interface');
    expect(tool.description).toBeTruthy();
    expect(tool.inputParams).toBeDefined();
    expect(tool.annotations).toBeDefined();
    expect(tool.annotations.readOnlyHint).toBe(false);
    expect(tool.annotations.destructiveHint).toBe(false);
    expect(tool.tool).toBeDefined();
  });
});
