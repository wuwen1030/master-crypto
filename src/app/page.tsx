import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Main content - will take all available space and center content */}
      <div className="flex-1 flex items-center py-8 md:py-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Left side - QR Code */}
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative w-[280px] h-[280px] md:w-[400px] md:h-[400px]">
                <Image
                  src="/pay_qr.JPG"
                  alt="WeChat Pay QR Code"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Right side - Content */}
            <div className="w-full md:w-1/2 space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                支持与赞助
              </h1>
              <div className="prose dark:prose-invert">
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  感谢您对本项目的支持！您的赞助将帮助我们持续改进和维护服务。
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  扫描左侧二维码即可进行赞助。
                </p>
              </div>
              <div className="pt-6 flex gap-4 flex-wrap">
                <a
                  href="/funding-rate"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  开始使用
                </a>
                <a
                  href="https://github.com/wuwen1030/master-crypto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gray-700 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  查看源代码
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - will stay at bottom */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2024 Master Crypto. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
