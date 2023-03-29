export type DockerHubV2ApiResponse<T> = {
    count: number,
    next: string | null;
    previous: string | null;
    results: T[];
}

export type DockerHubV2Repository = {
    description: string,
    name: string,
    namespace: string,
    repository_type: 'image'
    user: string
}

export type DockerHubV2Tags = {
    last_updated: string,
    name: string
}
