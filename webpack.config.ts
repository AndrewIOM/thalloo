import * as webpack from 'webpack'
import * as path from 'path'

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimiseCssAssets = require('optimize-css-assets-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const config: webpack.Configuration = {
    mode: "production",
    entry: {
        main: "./src/Scripts/main.ts"//,
        // styles: "./_sass/main.scss"
    },
    output: {
        filename: "[name].bundle.js",
        chunkFilename: "[name].chunk.js",
        path: path.resolve(__dirname, 'assets/scripts/'),
        publicPath: "/scripts/",
        libraryTarget: 'var',
        library: 'Thalloo'    
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        modules: [
            path.resolve('src'),
            'node_modules'
        ]
    },
    externals: {
        //knockout: "knockout"
    },
    module: {
        rules: [{
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(sass|scss)$/,
                loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin({
            filename: './../css/styles.css',
            allChunks: true,
        }),
        new OptimiseCssAssets({
            assetNameRegExp: /\.min\.css$/,
            cssProcessorOptions: { discardComments: { removeAll: true } }
        }),
        new UglifyJSPlugin({
            sourceMap: true,
            include: /\.min\.js$/,
            parallel: 4
        }),
        new webpack.optimize.OccurrenceOrderPlugin(true)
    ],
}

export default config