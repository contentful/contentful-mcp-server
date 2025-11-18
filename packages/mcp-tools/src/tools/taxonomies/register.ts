import { conceptSchemeTools } from './concept-schemes/register.js';
import { conceptTools } from './concepts/register.js';

export const taxonomyTools = {
  ...conceptSchemeTools,
  ...conceptTools,
};
