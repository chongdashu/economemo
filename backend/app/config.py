class Config:
    class SupportedSites:
        WHITELIST = [
            "news.yahoo.com",
            "cnn.com",
            "nytimes.com",
            "foxnews.com",
            "bbc.com",
            "bbc.co.uk",
            "msn.com",
            "reuters.com",
            "wsj.com",
            "nbcnews.com",
            "news.google.com",
            "economist.com",
        ]

        @classmethod
        def is_supported(cls, url: str) -> bool:
            return any(site in url for site in cls.WHITELIST)


config = Config()
