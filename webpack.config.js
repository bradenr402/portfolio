import path from 'path';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { fileURLToPath } from 'url';

// Helper functions
import { collectBlogPostsMeta, buildBlogPostPage, buildStandaloneBlogIndexPage, injectRecentPosts, processMarkdown } from './src/helpers/blog-build.js';
import { collectTilEntries, readTilEntry, buildStandaloneTilPage, buildTilDetailPage } from './src/helpers/til-build.js';
import applyBaseLayout from './src/helpers/apply-base-layout.js';
import {
  blogMarkdownPathFromRequestPath,
  blogSlugFromRequestPath,
  createDevMiddleware,
  tilEntryPathFromRequestPath,
  tilMarkdownPathFromEntryPath,
} from './src/helpers/dev-middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory
const DIST_DIR = path.resolve(__dirname, 'dist');
const PUBLIC_PATH = '/';
const MAIN_JS_FILENAME = 'main.js';
const MAIN_CSS_FILENAME = 'main.css';

function publicAssetPath(publicPath, filename) {
  const rootPath = publicPath.endsWith('/') ? publicPath : `${publicPath}/`;

  return `${rootPath}${filename.replace(/^\//, '')}`;
}

function createDevAssetTags({
  publicPath = '/',
  faviconPath,
  scriptFilename,
  cssFilename,
}) {
  return [
    `<link rel="icon" href="${publicAssetPath(publicPath, path.basename(faviconPath))}">`,
    `<script defer src="${publicAssetPath(publicPath, scriptFilename)}"></script>`,
    `<link href="${publicAssetPath(publicPath, cssFilename)}" rel="stylesheet">`,
  ].join('');
}

// Asset paths
const FAVICON_PATH = path.resolve(__dirname, './src/images/BR_logo.svg');
const DEV_ASSET_TAGS = createDevAssetTags({
  publicPath: PUBLIC_PATH,
  faviconPath: FAVICON_PATH,
  scriptFilename: MAIN_JS_FILENAME,
  cssFilename: MAIN_CSS_FILENAME,
});
const WATCH_EXTRA_CONTEXT_PATHS = [
  path.resolve(__dirname, 'src/components'),
  path.resolve(__dirname, 'src/images/icons'),
];
const WATCH_EXTRA_FILE_PATHS = [
  path.resolve(__dirname, 'src/blog/_template.html'),
  path.resolve(__dirname, 'src/til/_template.html'),
  path.resolve(__dirname, 'src/index.html'),
  path.resolve(__dirname, 'src/blog.html'),
  path.resolve(__dirname, 'src/til.html'),
  path.resolve(__dirname, 'src/404.html'),
];
const watchExtraFiles = {
  apply(compiler) {
    compiler.hooks.afterCompile.tap('WatchExtraFiles', (compilation) => {
      WATCH_EXTRA_CONTEXT_PATHS.forEach((dir) => compilation.contextDependencies.add(dir));
      WATCH_EXTRA_FILE_PATHS.forEach((file) => compilation.fileDependencies.add(file));
    });
  },
};

// Blog paths
const BLOG_DIR = path.resolve(__dirname, 'src/blog');
const BLOG_TEMPLATE_PATH = path.join(BLOG_DIR, '_template.html');
const BLOG_INDEX_TEMPLATE_PATH = path.resolve(__dirname, 'src/blog.html');
const BLOG_CSS_PATH = path.resolve(__dirname, 'src/blog.css');

// TIL paths
const TIL_DIR = path.resolve(__dirname, 'src/til');
const TIL_TEMPLATE_PATH = path.resolve(__dirname, 'src/til.html');
const TIL_CSS_PATH = path.resolve(__dirname, 'src/til.css');

// Placeholders
const BLOG_INDEX_PLACEHOLDER = '{{postList}}';
const TIL_LIST_PLACEHOLDER = '{{tilList}}';

// Collect all blog posts to generate HTML pages
const blogPosts = collectBlogPostsMeta(BLOG_DIR);

// Collect TIL entries to generate per-entry detail pages
const tilEntries = collectTilEntries(TIL_DIR);
const knownBlogSlugs = new Set(blogPosts.map((post) => post.slug));
const knownTilEntryPaths = new Set(tilEntries.map((entry) => entry.path));

const tilHtmlPlugins = tilEntries.map((entry) => {
  return new HtmlWebpackPlugin({
    filename: `til/${entry.path}.html`,
    favicon: FAVICON_PATH,
    templateContent: () => {
      const fresh = readTilEntry(entry.filePath);
      return applyBaseLayout(buildTilDetailPage(fresh));
    },
  });
});

const blogHtmlPlugins = blogPosts.map(post => {
  return new HtmlWebpackPlugin({
    filename: `blog/${post.slug}.html`,
    favicon: FAVICON_PATH,
    templateContent: () => {
      let content = fs.readFileSync(post.filePath, 'utf8');

      const processed = processMarkdown(content, post.filePath);
      content = processed.html;
      const metadata = processed.metadata;

      const template = fs.readFileSync(BLOG_TEMPLATE_PATH, 'utf8');

      const pageHtml = buildBlogPostPage(
        content,
        template,
        { ...metadata, href: post.href },
      );

      return applyBaseLayout(pageHtml);
    },
  });
});

export default {
  entry: './src/index.js',
  mode: 'development',
  output: {
    path: DIST_DIR,
    filename: MAIN_JS_FILENAME,
    publicPath: PUBLIC_PATH,
    clean: true,
  },
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: DIST_DIR,
    },
    port: 8080,
    open: true,
    hot: true,
    compress: true,
    setupMiddlewares: (middlewares) => {
      middlewares.unshift(
        {
          name: 'dev-middleware',
          middleware: createDevMiddleware({
            blogDir: BLOG_DIR,
            blogTemplatePath: BLOG_TEMPLATE_PATH,
            tilDir: TIL_DIR,
            assetTags: DEV_ASSET_TAGS,
            knownBlogSlugs,
            knownTilEntryPaths,
          }),
        },
      );

      return middlewares;
    },
    historyApiFallback: {
      rewrites: [
        {
          // Allow extensionless blog URLs like /blog/2026/01/01/post
          from: /^\/blog\/(.+)$/,
          to: (context) => {
            const requestPath = `/blog/${context.match[1]}`;
            const slug = blogSlugFromRequestPath(requestPath);
            if (!slug) return '/404.html';

            // Check if this slug matches an actual blog post
            const markdownPath = blogMarkdownPathFromRequestPath(BLOG_DIR, requestPath);
            if (markdownPath) return `/blog/${slug}.html`;

            return '/404.html';
          },
        },
        {
          // Allow extensionless TIL: /til, /til/
          from: /^\/til\/?$/,
          to: () => '/til/index.html',
        },
        {
          // Allow extensionless TIL URLs like /til/2026/01/01/entry
          from: /^\/til\/(.+)$/,
          to: (context) => {
            const entryPath = tilEntryPathFromRequestPath(`/til/${context.match[1]}`);
            if (!entryPath) return '/404.html';

            const markdownPath = tilMarkdownPathFromEntryPath(TIL_DIR, entryPath);
            if (markdownPath) return `/til/${entryPath}.html`;

            return '/404.html';
          },
        },
        // 404 page; last rewrite rule to catch anything not handled above
        { from: /.*/, to: '/404.html' },
      ],
    },
  },
  plugins: [
    watchExtraFiles,
    new MiniCssExtractPlugin({ filename: MAIN_CSS_FILENAME }),
    new HtmlWebpackPlugin({
      filename: '404.html',
      favicon: FAVICON_PATH,
      templateContent: () => {
        const html = fs.readFileSync(path.resolve(__dirname, 'src/404.html'), 'utf8');
        return applyBaseLayout(injectRecentPosts(html, blogPosts));
      },
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      favicon: FAVICON_PATH,
      templateContent: () => {
        const html = fs.readFileSync(path.resolve(__dirname, 'src/index.html'), 'utf8');
        return applyBaseLayout(injectRecentPosts(html, blogPosts));
      },
    }),
    new HtmlWebpackPlugin({
      filename: 'blog/index.html',
      favicon: FAVICON_PATH,
      templateContent: () =>
        applyBaseLayout(
          buildStandaloneBlogIndexPage(
            BLOG_DIR,
            BLOG_INDEX_TEMPLATE_PATH,
            BLOG_INDEX_PLACEHOLDER,
          ),
        ),
    }),
    new HtmlWebpackPlugin({
      filename: 'til/index.html',
      favicon: FAVICON_PATH,
      templateContent: () =>
        applyBaseLayout(
          buildStandaloneTilPage(TIL_DIR, TIL_TEMPLATE_PATH, TIL_LIST_PLACEHOLDER),
        ),
    }),
    ...blogHtmlPlugins,
    ...tilHtmlPlugins,
    new CopyWebpackPlugin({
      patterns: [
        {
          // Copy the favicon to a stable path used by all pages
          from: FAVICON_PATH,
          to: 'favicon.svg',
        },
        {
          // Copy general images (including icons) used by the site
          from: path.resolve(__dirname, 'src/images'),
          to: 'images',
        },
        {
          // Copy blog.css to the output directory
          from: BLOG_CSS_PATH,
          to: 'blog.css',
        },
        {
          // Copy til.css to the output directory
          from: TIL_CSS_PATH,
          to: 'til.css',
        },
        {
          // Copy blog/*.css to the output directory
          from: path.resolve(__dirname, 'src/blog/*.css'),
          to({ absoluteFilename }) {
            const fileName = path.basename(absoluteFilename);
            return `blog/${fileName}`;
          }
        },
        {
          // Copy non-Markdown assets (e.g., images) from the blog directory,
          // preserving the nested yyyy/mm/dd structure alongside the posts.
          from: path.resolve(__dirname, 'src/blog'),
          to: 'blog',
          globOptions: {
            ignore: ['**/*.md', '**/_template.html', '**/.DS_Store'],
          },
        },
        {
          // Copy non-Markdown assets (e.g., images) from the TIL directory,
          // preserving the nested yyyy/mm/dd structure alongside the entries.
          from: path.resolve(__dirname, 'src/til'),
          to: 'til',
          noErrorOnMissing: true,
          globOptions: {
            ignore: ['**/*.md', '**/_template.html', '**/.DS_Store'],
          },
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', '@tailwindcss/webpack'],
      },
      {
        test: /\.html$/i,
        use: ['html-loader'],
      },
      {
        // Fonts — stable filenames so pages can <link rel="preload"> them
        test: /\.(woff2?|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
      {
        test: /\.svg$/i,
        oneOf: [
          {
            // SVGs referenced via CSS url() — emit as a file so the
            // browser gets a real URL (asset/source would inline the
            // raw markup, breaking mask-image / background-image).
            dependency: 'url',
            type: 'asset/resource',
          },
          {
            // SVGs imported in JS — return the raw source string.
            type: 'asset/source',
          },
        ],
      },
    ],
  },
};
