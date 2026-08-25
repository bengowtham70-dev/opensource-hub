---
name: internet-trending-search
description: Search for trending topics across the internet in real-time. Use when you need to find what's popular on Twitter, Reddit, Google Trends, Hacker News, Product Hunt, or GitHub. USE FOR: trending topics, what's popular now, hot discussions, viral content, trending tech, market research.
---

# Internet Trending Search

Search multiple platforms simultaneously to discover trending topics and viral content.

## Supported Platforms

| Platform | What It Finds |
|----------|---------------|
| Twitter/X | Real-time conversations, hashtags, breaking news |
| Reddit | Community discussions, subreddit trends |
| Google Trends | Search volume trends, rising queries |
| Hacker News | Tech stories, startup news, developer discussions |
| Product Hunt | New product launches, app releases |
| GitHub | Trending repos, popular open source projects |

## How to Use

### Step 1: Identify Search Intent
Determine what the user wants to find:
- General trending topics
- Domain-specific trends (tech, AI, finance, etc.)
- Competitor/product research
- Content ideas

### Step 2: Choose Platforms
Select relevant platforms based on intent:
- **Breaking news**: Twitter, Reddit
- **Tech trends**: Hacker News, GitHub, Product Hunt
- **Market research**: Google Trends, Twitter, Reddit
- **Product ideas**: Product Hunt, Hacker News

### Step 3: Construct Search Query
Use the websearch tool with appropriate parameters:
- `query`: Specific search terms
- `numResults`: 5-10 for focused, 10-20 for broad
- `type`: "fast" for quick results, "deep" for comprehensive

### Step 4: Analyze and Summarize
Present findings organized by:
1. **Top trending topics** (with volume/engagement metrics)
2. **Rising trends** (newly emerging)
3. **Platform-specific highlights**
4. **Relevance to user's project**

## Example Queries

```
# General trending
"What's trending in AI right now"

# Platform-specific
"Top posts on Hacker News today"
" trending on Product Hunt this week"

# Domain research
"What are competitors doing in the AI agent space"
```

## Tips
- Use `livecrawl: "preferred"` for most current data
- Combine multiple searches for comprehensive coverage
- Check timestamps to ensure data freshness
- Cross-reference trends across platforms for validation
