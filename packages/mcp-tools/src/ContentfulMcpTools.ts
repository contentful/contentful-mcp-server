import type { ContentfulConfig } from './config/types.js';
import { createAiActionTools } from './tools/ai-actions/register.js';
import { createAssetTools } from './tools/assets/register.js';
import { createContentTypeTools } from './tools/content-types/register.js';
import { createContextTools } from './tools/context/register.js';
import { createEditorInterfaceTools } from './tools/editor-interfaces/register.js';
import { createEntryTools } from './tools/entries/register.js';
import { createEnvironmentTools } from './tools/environments/register.js';
import { createLocaleTools } from './tools/locales/register.js';
import { createOrgTools } from './tools/orgs/register.js';
import { createSpaceTools } from './tools/spaces/register.js';
import { createTagTools } from './tools/tags/register.js';
import { createTaxonomyTools } from './tools/taxonomies/register.js';
import { createJobTools } from './tools/jobs/space-to-space-migration/register.js';

/**
 * Main class for Contentful MCP Tools
 * 
 * This class encapsulates all Contentful MCP tools and provides methods
 * to access tool collections. Configuration is passed to the constructor
 * and can be updated at runtime.
 */
export class ContentfulMcpTools {
  private config: ContentfulConfig;

  constructor(config: ContentfulConfig) {
    // Set defaults
    this.config = {
      ...config,
      host: config.host ?? 'api.contentful.com',
      environmentId: config.environmentId ?? 'master',
    };
  }

  /**
   * Update the configuration after initialization
   * 
   * @param updates - Partial configuration to merge with existing config
   */
  updateConfig(updates: Partial<ContentfulConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get AI action tools
   */
  getAiActionTools() {
    return createAiActionTools(this.config);
  }

  /**
   * Get asset tools
   */
  getAssetTools() {
    return createAssetTools(this.config);
  }

  /**
   * Get content type tools
   */
  getContentTypeTools() {
    return createContentTypeTools(this.config);
  }

  /**
   * Get context tools
   */
  getContextTools() {
    return createContextTools(this.config);
  }

  /**
   * Get editor interface tools
   */
  getEditorInterfaceTools() {
    return createEditorInterfaceTools(this.config);
  }

  /**
   * Get entry tools
   */
  getEntryTools() {
    return createEntryTools(this.config);
  }

  /**
   * Get environment tools
   */
  getEnvironmentTools() {
    return createEnvironmentTools(this.config);
  }

  /**
   * Get locale tools
   */
  getLocaleTools() {
    return createLocaleTools(this.config);
  }

  /**
   * Get organization tools
   */
  getOrgTools() {
    return createOrgTools(this.config);
  }

  /**
   * Get space tools
   */
  getSpaceTools() {
    return createSpaceTools(this.config);
  }

  /**
   * Get tag tools
   */
  getTagTools() {
    return createTagTools(this.config);
  }

  /**
   * Get taxonomy tools
   */
  getTaxonomyTools() {
    return createTaxonomyTools(this.config);
  }

  /**
   * Get job tools (space-to-space migration)
   */
  getJobTools() {
    return createJobTools(this.config);
  }
}

