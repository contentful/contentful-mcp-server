import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { EditorInterfaceProps } from 'contentful-management';

// Define control schema for editor interface controls
const ControlSchema = z.object({
  fieldId: z.string().describe('The field ID this control applies to'),
  widgetId: z.string().describe('The widget ID to use for this field'),
  widgetNamespace: z
    .enum(['builtin', 'extension', 'app', 'editor-builtin'])
    .optional()
    .describe(
      'The namespace of the widget (builtin, extension, app, or editor-builtin)',
    ),
  settings: z
    .record(z.any())
    .optional()
    .describe('Settings object for the widget'),
});

// Define sidebar schema
const SidebarItemSchema = z.object({
  widgetId: z.string().describe('The widget ID for the sidebar item'),
  widgetNamespace: z
    .enum(['sidebar-builtin', 'extension', 'app'])
    .describe('The namespace of the sidebar widget'),
  settings: z
    .record(z.any())
    .optional()
    .describe('Settings object for the sidebar widget'),
  disabled: z
    .boolean()
    .optional()
    .describe('Whether the sidebar item is disabled'),
});

// Define editor layout schema
const EditorLayoutItemSchema = z.object({
  fieldId: z.string().describe('The field ID'),
  settings: z
    .record(z.any())
    .optional()
    .describe('Layout settings for the field'),
});

const EditorLayoutSchema = z.object({
  items: z
    .array(EditorLayoutItemSchema)
    .optional()
    .describe('Array of editor layout items'),
});

// Define groupControl schema
const GroupControlSchema = z.object({
  groupId: z.string().describe('The group ID'),
  widgetId: z.string().describe('The widget ID for the group control'),
  widgetNamespace: z
    .enum(['builtin', 'extension', 'app'])
    .optional()
    .describe('The namespace of the group control widget'),
  settings: z
    .record(z.any())
    .optional()
    .describe('Settings object for the group control'),
});

export const UpdateEditorInterfaceToolParams = BaseToolSchema.extend({
  contentTypeId: z
    .string()
    .describe('The ID of the content type to update the editor interface for'),
  controls: z
    .array(ControlSchema)
    .optional()
    .describe(
      'Array of control definitions for fields in the content type. Each control defines which widget to use for a field.',
    ),
  sidebar: z
    .array(SidebarItemSchema)
    .optional()
    .describe('Array of sidebar widget configurations'),
  editorLayout: z
    .array(EditorLayoutSchema)
    .optional()
    .describe('Editor layout configuration for organizing fields'),
  groupControls: z
    .array(GroupControlSchema)
    .optional()
    .describe('Array of group control definitions for field groups'),
});

type Params = z.infer<typeof UpdateEditorInterfaceToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    contentTypeId: args.contentTypeId,
  };

  const contentfulClient = createToolClient(args);

  // Get the current editor interface
  const currentEditorInterface =
    await contentfulClient.editorInterface.get(params);

  // Build the update payload
  const updatePayload: Record<string, unknown> = {
    ...currentEditorInterface,
  };

  // Update only the fields that are provided
  if (args.controls !== undefined) {
    updatePayload['controls'] = args.controls;
  }

  if (args.sidebar !== undefined) {
    updatePayload['sidebar'] = args.sidebar;
  }

  if (args.editorLayout !== undefined) {
    updatePayload['editorLayout'] = args.editorLayout;
  }

  if (args.groupControls !== undefined) {
    updatePayload['groupControls'] = args.groupControls;
  }

  // Update the editor interface
  const editorInterface = await contentfulClient.editorInterface.update(
    params,
    updatePayload as EditorInterfaceProps,
  );

  return createSuccessResponse('Editor interface updated successfully', {
    editorInterface,
  });
}

export const updateEditorInterfaceTool = withErrorHandling(
  tool,
  'Error updating editor interface',
);
