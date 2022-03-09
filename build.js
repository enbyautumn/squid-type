require('esbuild').build({
    entryPoints: ['peer.ts', 'client.ts'],
    outdir: 'build',
    bundle: true,
    watch: {
        onRebuild(error, result) {
            if (error) console.error('watch build failed:', error)
            else console.log('watch build succeeded:', result)
        },
    },
}).then(result => {
    console.log('watching...')
})