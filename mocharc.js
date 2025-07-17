module.exports = {
    // Configure mocha to run tests with ts-node/esm loader
    require: 'ts-node/register',
    extension: ['ts'],
    spec: 'test/**/*.test.ts',
    node_args: ['--loader=ts-node/esm'],
    parallel: false, // Ensure tests run sequentially
    timeout: 60000, // Set timeout to 60 seconds
}
