module.exports = {
    env: {
        test: {
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: ['last 1 version', 'ie >= 11'],
                    },
                ],
                '@babel/preset-react',
            ],
            plugins: ['@babel/plugin-transform-runtime'],
        },
    },
};
