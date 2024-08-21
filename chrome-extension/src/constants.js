var WHITELISTED_SITES = [
  {
    domain: "yahoo.com",
    articlePattern:
      /^https:\/\/(www\.)?(yahoo\.com\/news\/|news\.yahoo\.com\/).*(-\d+\.html|\.[a-zA-Z]+)$/,
  },
  {
    domain: "cnn.com",
    articlePattern:
      /^https:\/\/(edition\.)?cnn\.com\/\d{4}\/\d{2}\/\d{2}\/.*\/index\.html$/,
  },
  {
    domain: "nytimes.com",
    articlePattern:
      /^https:\/\/www\.nytimes\.com\/\d{4}\/\d{2}\/\d{2}\/.*\.html$/,
  },
  {
    domain: "foxnews.com",
    articlePattern: /^https:\/\/www\.foxnews\.com\/.*$/,
  },
  {
    domain: "bbc.com",
    articlePattern:
      /^https:\/\/www\.bbc\.com\/(news|sport)(\/\w+)*\/([a-z0-9-]+|\w+\/articles\/[a-z0-9]+)$/,
  },
  {
    domain: "bbc.co.uk",
    articlePattern:
      /^https:\/\/www\.bbc\.co\.uk\/(news|sport)(\/\w+)*\/(articles\/[a-z0-9]+|live\/[a-z0-9]+|[a-z0-9-]+)$/,
  },
  {
    domain: "msn.com",
    articlePattern: /^https:\/\/www\.msn\.com\/.*\/ar-.*$/,
  },
  {
    domain: "reuters.com",
    articlePattern: /^https:\/\/www\.reuters\.com\/.*\/.*-.*\/$/,
  },
  {
    domain: "wsj.com",
    articlePattern: /^https:\/\/www\.wsj\.com\/articles\/.*$/,
  },
  {
    domain: "nbcnews.com",
    articlePattern: /^https:\/\/www\.nbcnews\.com\/.*$/,
  },
  {
    domain: "news.google.com",
    articlePattern: /^https:\/\/news\.google\.com\/articles\/.*$/,
  },
  {
    domain: "economist.com",
    articlePattern:
      /^https:\/\/www\.economist\.com\/[a-z-]+\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+$/,
  },
];

export function isWhitelistedArticlePage(url) {
  return WHITELISTED_SITES.some((site) => site.articlePattern.test(url));
}
