# Master Crypto

A modern cryptocurrency trading platform built with Next.js, providing real-time market data and trading capabilities.

## Project Overview

Master Crypto is a web application that allows users to:
- Track cryptocurrency prices and market trends
- View detailed charts and trading indicators
- Execute mock trades for learning purposes
- Create and manage watchlists

## Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
- **UI Components**: Tailwind CSS, Shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **API Integration**: Cryptocurrency data providers
- **Authentication**: NextAuth.js
- **Charts**: TradingView Lightweight Charts
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/master-crypto.git
cd master-crypto
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Fill in your API keys and other required variables in `.env.local`

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
