import path from 'path';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';

// Helper functions
import { collectBlogPostsMeta, buildBlogPostPage, buildStandaloneBlogIndexPage, processMarkdown } from './src/helpers/blog-build.js';
import applyBaseLayout from './src/helpers/apply-base-layout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory
const DIST_DIR = path.resolve(__dirname, 'dist');

// Asset paths
const FAVICON_PATH = path.resolve(__dirname, './src/images/BR_logo.svg');

// Blog paths
const BLOG_DIR = path.resolve(__dirname, 'src/blog');
const BLOG_TEMPLATE_PATH = path.join(BLOG_DIR, '_template.html');
const BLOG_INDEX_TEMPLATE_PATH = path.resolve(__dirname, 'src/blog.html');
const BLOG_CSS_PATH = path.resolve(__dirname, 'src/blog.css');

// Placeholders
const BLOG_INDEX_PLACEHOLDER = '{{postList}}';

// Collect all blog posts to generate HTML pages
const blogPosts = collectBlogPostsMeta(BLOG_DIR);

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
        metadata,
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
    filename: 'main.js',
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
    historyApiFallback: {
      rewrites: [
        {
          // Allow extensionless blog URLs like /blog/2026/01/12/post-title
          from: /^\/blog\/(.+)$/,
          to: (context) => {
            let slug = context.match[1];

            // Trim a trailing slash before appending .html, so both
            // /blog/2026/01/12/post and /blog/2026/01/12/post/ work.
            slug = slug.replace(/\/$/, '');
            if (!slug) return '/blog/index.html';

            return `/blog/${slug}.html`;
          },
        },
      ],
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      favicon: FAVICON_PATH,
      templateContent: () => {
        const html = fs.readFileSync(path.resolve(__dirname, 'src/index.html'), 'utf8');
        return applyBaseLayout(html);
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
    ...blogHtmlPlugins,
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
          // Copy blog/*.css to the output directory
          from: path.resolve(__dirname, 'src/blog/*.css'),
          to({ context, absoluteFilename }) {
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
            ignore: ['**/*.md', '**/_template.html'],
          },
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.html$/i,
        use: ['html-loader'],
      },
      {
        test: /\.svg$/i,
        type: 'asset/source',
      },
    ],
  },
};
