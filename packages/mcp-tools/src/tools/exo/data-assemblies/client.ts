// Shared endpoint for DataAssembly writes through the SDK's raw transport.
export function dataAssembliesPath(
  spaceId: string,
  environmentId: string,
): string {
  return `/spaces/${spaceId}/environments/${environmentId}/data_assemblies`;
}
