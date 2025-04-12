import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="relative h-[600px]">
        <Image
          src="/hero.jpg"
          alt="Hero image"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent">
          <div className="container mx-auto px-4 pt-32">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Master Crypto Trading
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Take control of your crypto investments with advanced analytics and real-time market insights.
            </p>
            <div className="flex gap-4">
              <a
                href="/funding-rate"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Get Started
              </a>
              <a
                href="#features"
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-medium backdrop-blur-sm transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>

      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4">Real-time Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor market trends and make informed decisions with our advanced analytics tools.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4">Portfolio Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Keep track of your investments and performance in real-time.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4">Smart Alerts</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get notified about important market movements and opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2024 Master Crypto. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
