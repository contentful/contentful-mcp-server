import { describe, it, expect } from 'vitest';
import { createMockConfig } from '../../test-helpers/mockConfig.js';
import { createComponentTools } from './components/register.js';
import { createExperienceTemplateTools } from './experience-templates/register.js';
import { createExperienceFragmentTools } from './experience-fragments/register.js';
import { createExperienceTools } from './experiences/register.js';
import { createDataAssemblyTools } from './data-assemblies/register.js';
import { createDesignTokenTools } from './design-tokens/register.js';

/**
 * The ExO tool `title` strings are the names the MCP client actually calls, and
 * nothing else in the suite asserts them — a typo would ship silently and only
 * surface as a missing tool at runtime. This locks the full set of 41.
 */
const EXPECTED_TITLES = [
  // components (7)
  'create_component',
  'delete_component',
  'get_component',
  'list_components',
  'publish_component',
  'unpublish_component',
  'upsert_component',
  // experience-templates (7)
  'create_experience_template',
  'delete_experience_template',
  'get_experience_template',
  'list_experience_templates',
  'publish_experience_template',
  'unpublish_experience_template',
  'upsert_experience_template',
  // experience-fragments (7) — note `update_`, not `upsert_`, is intentional
  'create_experience_fragment',
  'delete_experience_fragment',
  'get_experience_fragment',
  'list_experience_fragments',
  'publish_experience_fragment',
  'unpublish_experience_fragment',
  'update_experience_fragment',
  // experiences (7)
  'create_experience',
  'delete_experience',
  'get_experience',
  'list_experiences',
  'publish_experience',
  'unpublish_experience',
  'upsert_experience',
  // data-assemblies (9)
  'create_data_assembly',
  'delete_data_assembly',
  'get_data_assembly',
  'get_published_data_assembly',
  'list_data_assemblies',
  'list_published_data_assemblies',
  'publish_data_assembly',
  'unpublish_data_assembly',
  'update_data_assembly',
  // design-tokens (4) — no create/publish/unpublish: upsert both creates and
  // updates, and every upsert auto-publishes server-side
  'delete_design_token',
  'get_design_token',
  'list_design_tokens',
  'upsert_design_token',
].sort();

describe('ExO tool registration', () => {
  const config = createMockConfig();

  const allTitles = [
    createComponentTools(config),
    createExperienceTemplateTools(config),
    createExperienceFragmentTools(config),
    createExperienceTools(config),
    createDataAssemblyTools(config),
    createDesignTokenTools(config),
  ]
    .flatMap((collection) => Object.values(collection))
    .map((entry) => entry.title)
    .sort();

  it('registers exactly the expected 41 ExO tool titles', () => {
    // Exact set equality, so this also fails on any surviving pre-rename name
    // (`*_component_type`, bare `*_template`, bare `*_fragment`).
    expect(allTitles).toEqual(EXPECTED_TITLES);
  });
});
