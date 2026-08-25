---
name: rating-system
description: Evaluate and rate items using structured scoring systems. Use when assessing quality, reviewing work, scoring performance, comparing options, or making data-driven decisions.
---

# Rating System

## Overview

Structured evaluation framework for scoring and rating items across multiple dimensions with weighted criteria.

## When to Use

- Reviewing code quality
- Evaluating presentations
- Assessing document quality
- Comparing options or solutions
- Performance evaluation
- Quality assurance
- Decision-making support

## Rating Framework

### 5-Point Rating Scale

| Score | Label | Description |
|-------|-------|-------------|
| 5 | Excellent | Exceeds expectations, outstanding quality |
| 4 | Good | Meets expectations, solid quality |
| 3 | Acceptable | Meets minimum requirements |
| 2 | Needs Improvement | Below expectations, requires work |
| 1 | Poor | Does not meet requirements |

### 10-Point Rating Scale

| Score | Label | Description |
|-------|-------|-------------|
| 9-10 | Exceptional | World-class, exceptional quality |
| 7-8 | Good | Above average, solid performance |
| 5-6 | Average | Meets basic requirements |
| 3-4 | Below Average | Needs significant improvement |
| 1-2 | Poor | Unacceptable quality |

## Evaluation Dimensions

### Code Quality Rating
- **Functionality**: Does it work correctly?
- **Readability**: Is it easy to understand?
- **Maintainability**: Can it be easily modified?
- **Performance**: Is it efficient?
- **Security**: Is it secure?
- **Testing**: Is it well-tested?

### Presentation Quality Rating
- **Content**: Is the information accurate and relevant?
- **Structure**: Is it well-organized?
- **Design**: Is it visually appealing?
- **Clarity**: Is it easy to understand?
- **Engagement**: Does it hold attention?
- **Delivery**: Is it presentable?

### Document Quality Rating
- **Completeness**: Is all information present?
- **Accuracy**: Is the information correct?
- **Clarity**: Is it easy to understand?
- **Formatting**: Is it well-formatted?
- **Accessibility**: Can everyone use it?
- **Currency**: Is it up to date?

## Scoring Methodology

### Simple Average
```
Total Score = (Sum of all scores) / (Number of criteria)
```

### Weighted Average
```
Total Score = Σ (Score × Weight) / Σ Weights
```

### Threshold-Based
```
Pass: All critical criteria ≥ 3
Fail: Any critical criteria < 3
```

## Output Format

```
## Rating Report

### Item: [Name/Description]
### Overall Score: [X]/5 (or X/10)

### Detailed Scores

| Criterion | Score | Weight | Weighted Score |
|-----------|-------|--------|----------------|
| [Criterion 1] | [X]/5 | [W]% | [X] |
| [Criterion 2] | [X]/5 | [W]% | [X] |
| [Criterion 3] | [X]/5 | [W]% | [X] |

### Strengths
- [Strength 1]
- [Strength 2]

### Areas for Improvement
- [Area 1]
- [Area 2]

### Recommendations
1. [Recommendation]
2. [Recommendation]

### Summary
[Overall assessment and verdict]
```

## Comparison Matrix

When comparing multiple options:

| Criteria | Weight | Option A | Option B | Option C |
|----------|--------|----------|----------|----------|
| [Criterion 1] | 30% | [Score] | [Score] | [Score] |
| [Criterion 2] | 25% | [Score] | [Score] | [Score] |
| [Criterion 3] | 25% | [Score] | [Score] | [Score] |
| [Criterion 4] | 20% | [Score] | [Score] | [Score] |
| **Weighted Total** | 100% | **[Total]** | **[Total]** | **[Total]** |

## Best Practices

- Define criteria before evaluation
- Use consistent scoring scales
- Include both quantitative and qualitative measures
- Document scoring rationale
- Consider multiple perspectives
- Review and validate ratings
- Provide actionable feedback
- Track ratings over time for trends
