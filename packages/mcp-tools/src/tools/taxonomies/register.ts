import { createConceptSchemeTools } from './concept-schemes/register.js';
import { createConceptTools } from './concepts/register.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createTaxonomyTools(config: ContentfulConfig) {
  const conceptSchemeTools = createConceptSchemeTools(config);
  const conceptTools = createConceptTools(config);

  return {
    ...conceptSchemeTools,
    ...conceptTools,
  };
}
