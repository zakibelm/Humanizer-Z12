# H-Z12 - Humanizer Z12

<div align="center">

**Advanced AI Text Humanization Platform with Multi-Model Support**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

**H-Z12 (Humanizer Z12)** is a production-ready web application that transforms AI-generated text into human-like content through advanced stylometric analysis and multi-model agentic refinement loops.

### Key Features

- **Multi-Model AI Support** - Access 15+ leading AI models (Claude, GPT-4, Gemini, Qwen, GLM, Kimi, Llama, Mistral) via unified OpenRouter API
- **Agentic Loop Architecture** - Iterative refinement until AI detection score < 20%
- **Stylometric Analysis** - Deep linguistic profiling (TTR, perplexity, burstiness, Flesch reading ease)
- **ZeroGPT Integration** - Automated AI detection validation
- **Style Library** - Save and reuse writing styles with profile matching
- **Performance Optimized** - ~70% performance improvement on critical operations (see [REFACTOR_SUMMARY.md](./REFACTOR_SUMMARY.md))

---

## Architecture

```
User Input Text
       ↓
┌──────────────────────┐
│   Generator LLM      │  ← Claude/GPT/Qwen/GLM/Kimi
│  (Paraphrasing)      │     Transforms text
└──────────────────────┘
       ↓
┌──────────────────────┐
│  Analyzer LLM        │  ← Stylometric Analysis
│  (TTR, Perplexity)   │     Linguistic profiling
└──────────────────────┘
       ↓
┌──────────────────────┐
│   ZeroGPT Detector   │  ← AI Detection API
│  (Validation)        │     Measures AI likelihood
└──────────────────────┘
       ↓
   < 20% AI?
   Yes → Output
   No  → Refiner LLM → Loop back
```

### Workflow Logic

1. **Generator** - LLM paraphrases/humanizes input text
2. **Analyzer** - Computes stylometric metrics (optional)
3. **ZeroGPT** - Detects AI percentage (requires API key)
4. **Refiner** - If > 20% AI detected, refines text and loops (agentic mode)

---

## Installation

### Prerequisites

- **Node.js** 18+ and npm
- **OpenRouter API Key** ([Get one here](https://openrouter.ai/))
- **ZeroGPT API Key** (optional, for agentic loop)

### Setup

```bash
# Clone the repository
git clone https://github.com/zakibelm/H-Z12.git
cd H-Z12

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Configuration

### API Keys

1. Open the app in your browser
2. Click **Settings** (gear icon)
3. Navigate to **Clés API** tab
4. Enter your API keys:
   - **OpenRouter** (required) - Unified access to all AI models
   - **ZeroGPT** (optional) - Enables agentic loop with automatic refinement

### Model Assignment

In **Settings → Modèles IA**, assign models to roles:

- **Générateur** - Primary text transformation (e.g., Claude 3.5 Sonnet, GPT-4o)
- **Raffineur** - Iterative refinement in agentic mode (e.g., Qwen 2.5 72B)
- **Analyseur** - Stylometric analysis (e.g., GPT-3.5 Turbo for cost efficiency)

### Recommended Model Configurations

| Use Case | Generator | Refiner | Analyzer |
|----------|-----------|---------|----------|
| **High Quality** | Claude 3.5 Sonnet | Claude 3 Opus | GPT-3.5 Turbo |
| **Cost Efficient** | Qwen 2.5 72B | Llama 3.1 70B | Qwen 2.5 7B |
| **Ultra Fast** | GPT-4o | Claude 3 Haiku | GLM-4 9B |

---

## Performance Optimizations

This codebase has been extensively optimized. Key improvements:

| Component | Optimization | Performance Gain |
|-----------|-------------|------------------|
| **Stylometric Analysis** | Eliminated O(n²) re-tokenization | **-81%** (480ms → 90ms) |
| **Regex Markdown Parsing** | Non-greedy quantifiers + fallback | **-97%** (800ms → 25ms on 50K chars) |
| **ID Generation** | Cached crypto availability | **-80%** (15ms → 3ms for 10K IDs) |
| **LRU Cache Eviction** | Monotonic counter instead of sort | **-75%** (12ms → 3ms) |
| **Timer Cleanup** | Fixed memory leak | **40MB** saved per 1K requests |
| **JSON Parsing** | Strict validation + error handling | **Crash prevention** |

See [REFACTOR_SUMMARY.md](./REFACTOR_SUMMARY.md) for complete benchmark details.

---

## Technologies

- **Frontend**: React 18.3, TypeScript 5.5, Tailwind CSS 3.4
- **Build Tool**: Vite 5.4
- **AI APIs**: OpenRouter (unified gateway), ZeroGPT (detection)
- **State Management**: React hooks + localStorage
- **Linguistic Analysis**: Intl.Segmenter API (tokenization)
- **Testing**: Vitest (unit tests)

---

## Project Structure

```
Humanizer-Z12/
├── src/
│   ├── components/          # React components
│   │   ├── SettingsModal.tsx    # Configuration UI
│   │   ├── StyleLibrary.tsx     # Style profiles
│   │   └── ...
│   ├── services/            # API clients
│   │   ├── aiService.ts         # Main orchestration
│   │   ├── openRouterService.ts # LLM client
│   │   ├── zeroGptService.ts    # Detection client
│   │   └── stylometryService.ts # Linguistic analysis
│   ├── utils/               # Utilities
│   │   ├── fetchWithTimeout.ts  # HTTP wrapper
│   │   ├── idGenerator.ts       # UUID generation
│   │   └── profileCache.ts      # LRU cache
│   ├── types.ts             # TypeScript interfaces
│   └── App.tsx              # Main component
├── REFACTOR_SUMMARY.md      # Performance optimization report
├── CRITICAL_ANALYSIS_FINAL.md # Code quality audit
└── package.json
```

---

## Available AI Models

### OpenRouter Models (15+)

| Model | Provider | Context | Cost/1K tokens |
|-------|----------|---------|----------------|
| Claude 3.5 Sonnet | Anthropic | 200K | $0.003 |
| GPT-4o | OpenAI | 128K | $0.005 |
| Gemini Pro 1.5 | Google | 1M | $0.00125 |
| Qwen 2.5 72B | Alibaba | 32K | $0.0004 |
| GLM-4 Plus | Zhipu AI | 128K | $0.0005 |
| Kimi Moonshot v1 32K | Moonshot | 32K | $0.0006 |
| Llama 3.1 70B | Meta | 131K | $0.00088 |
| Mistral Large | Mistral AI | 128K | $0.004 |

---

## Development

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Ensure all tests pass (`npm test`)
4. Maintain code coverage ≥ 90%
5. Follow existing code style (TypeScript strict mode)
6. Commit with descriptive messages
7. Open a Pull Request

---

## License

MIT License - See [LICENSE](LICENSE) file for details

---

## Support

For issues, questions, or feature requests:

- **GitHub Issues**: [Create an issue](https://github.com/zakibelm/H-Z12/issues)
- **Documentation**: [REFACTOR_SUMMARY.md](./REFACTOR_SUMMARY.md)

---

## Acknowledgments

- **OpenRouter** - Unified AI model gateway
- **ZeroGPT** - AI detection API
- **Anthropic, OpenAI, Google, Alibaba, Zhipu AI, Moonshot** - AI model providers

---

<div align="center">

**Built with precision | Optimized for performance | Ready for production**

</div>
