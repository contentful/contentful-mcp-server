import { describe, it, expect } from 'vitest';
import { createReleaseTools } from './register.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('createReleaseTools', () => {
  it('registers all 14 release tools with the expected titles', () => {
    const tools = createReleaseTools(createMockConfig());

    expect(Object.keys(tools)).toHaveLength(14);
    expect(tools.listReleases.title).toBe('list_releases');
    expect(tools.getRelease.title).toBe('get_release');
    expect(tools.createRelease.title).toBe('create_release');
    expect(tools.updateRelease.title).toBe('update_release');
    expect(tools.deleteRelease.title).toBe('delete_release');
    expect(tools.publishRelease.title).toBe('publish_release');
    expect(tools.unpublishRelease.title).toBe('unpublish_release');
    expect(tools.validateRelease.title).toBe('validate_release');
    expect(tools.getReleaseAction.title).toBe('get_release_action');
    expect(tools.listReleaseActions.title).toBe('list_release_actions');
    expect(tools.schedulePublishRelease.title).toBe(
      'schedule_publish_release',
    );
    expect(tools.scheduleUnpublishRelease.title).toBe(
      'schedule_unpublish_release',
    );
    expect(tools.cancelScheduledRelease.title).toBe('cancel_scheduled_release');
    expect(tools.listScheduledActions.title).toBe('list_scheduled_actions');
  });
});
