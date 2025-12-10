'use client'

import { WalletConnect } from '@/components/WalletConnect'
import { MyNFT } from '@/components/MyNFT'
import { Marketplace } from '@/components/Marketplace'
import { Profile } from '@/components/Profile'
import { ContractInfo } from '@/components/ContractInfo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useState } from 'react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    'marketplace' | 'mynft' | 'profile' | 'contracts'
  >('marketplace')

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* 헤더 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              My NFT Marketplace - 92113798 이현
            </h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="border-b bg-background dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {['marketplace', 'mynft', 'profile', 'contracts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                // [수정] text-gray-500 -> text-black (라이트모드에서 검정)
                className={`py-4 px-1 border-b-2 font-medium text-base whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-black hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'marketplace' && '마켓플레이스'}
                {tab === 'mynft' && '내 NFT'}
                {tab === 'profile' && '내 프로필'}
                {tab === 'contracts' && '컨트랙트 정보'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'marketplace' && <Marketplace />}
        {activeTab === 'mynft' && <MyNFT />}
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'contracts' && <ContractInfo />}
      </main>

      {/* 푸터 */}
      <footer className="border-t bg-background mt-12 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* [수정] text-gray-500 -> text-black */}
          <p className="text-center text-black dark:text-gray-400 text-sm">
            © 2025 My NFT Marketplace. Powered by Sepolia Testnet.
          </p>
        </div>
      </footer>
    </div>
  )
}